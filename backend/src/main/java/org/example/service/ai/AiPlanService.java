package org.example.service.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.dto.ai.PlanAdvisorRequestDTO;
import org.example.dto.ai.PlanAdvisorResponseDTO;
import org.example.repository.PlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiPlanService {

    private static final Logger logger = LoggerFactory.getLogger(AiPlanService.class);

    private final PlanRepository repo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.api.key:}")
    private String apiKey;

    @Value("${ai.api.url:}")
    private String apiUrl;

    @Value("${ai.model:gpt-3.5-turbo}")
    private String model;

    public AiPlanService(PlanRepository repo) {
        this.repo = repo;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public PlanAdvisorResponseDTO recommendPlan(PlanAdvisorRequestDTO request) {
        var allPlans = repo.findAllPlans();
        var featuresMap = repo.findPlanFeaturesByPlanIds(
                allPlans.stream().map(PlanRepository.PlanRow::planId).collect(Collectors.toList())
        );

        List<CompactPlan> compactPlans = allPlans.stream()
                .map(p -> new CompactPlan(p, featuresMap.getOrDefault(p.planId(), Collections.emptyList())))
                .collect(Collectors.toList());

        if (compactPlans.isEmpty()) {
            return createEmptyResponse();
        }

        if (apiKey != null && !apiKey.isBlank()) {
            try {
                return getAiRecommendation(request, compactPlans);
            } catch (Exception e) {
                logger.error("AI Recommendation failed, falling back to local logic. Error: {}", e.getMessage());
            }
        } else {
            logger.warn("AI API Key is missing. Using local fallback recommendation.");
        }

        return getFallbackRecommendation(request, compactPlans);
    }

    private PlanAdvisorResponseDTO getAiRecommendation(PlanAdvisorRequestDTO request, List<CompactPlan> plans) throws Exception {
        String systemPrompt = """
            You are a telecom plan advisor. Based on the provided list of plans and the user's requirements, recommend the best plan and a backup option.
            Return ONLY a valid JSON object with the following structure:
            {
              "recommendedPlanId": number,
              "recommendedPlanName": "string",
              "reason": "string",
              "matchSummary": "string",
              "alternatives": [
                { "planId": number, "planName": "string", "reason": "string" }
              ]
            }
            Do not include any other text or markdown formatting.
            """;

        String userMessage = String.format(
                "User Requirements: Mode=%s, ServiceType=%s, Budget=%d, Lines=%d, DataGb=%d, Priority=%s, UserPrompt='%s'.\n\nAvailable Plans: %s",
                request.getInputMode(),
                request.getServiceType(),
                request.getMonthlyBudget(),
                request.getNumberOfLines(),
                request.getEstimatedDataGb(),
                request.getPriority(),
                request.getUserPrompt() != null ? request.getUserPrompt() : "",
                objectMapper.writeValueAsString(plans)
        );

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage)
        ));
        body.put("temperature", 0.7);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            AiResponse aiRes = objectMapper.readValue(response.getBody(), AiResponse.class);
            String content = aiRes.choices.get(0).message.content.trim();

            // Handle cases where AI might wrap JSON in markdown blocks
            if (content.startsWith("```json")) {
                content = content.substring(7, content.length() - 3).trim();
            } else if (content.startsWith("```")) {
                content = content.substring(3, content.length() - 3).trim();
            }

            PlanAdvisorResponseDTO result = objectMapper.readValue(content, PlanAdvisorResponseDTO.class);
            result.setRecommendationMode("AI");
            result.setDisclaimer("AI-generated recommendation based on your needs.");
            return result;
        }

        throw new RuntimeException("AI API returned status " + response.getStatusCode());
    }

    private PlanAdvisorResponseDTO getFallbackRecommendation(PlanAdvisorRequestDTO request, List<CompactPlan> plans) {
        // Filter by service type if provided
        List<CompactPlan> filteredPlans = plans;
        if (request.getServiceType() != null && !request.getServiceType().isBlank()) {
             filteredPlans = plans.stream()
                    .filter(p -> p.serviceType != null && p.serviceType.equalsIgnoreCase(request.getServiceType()))
                    .collect(Collectors.toList());
        }

        if (filteredPlans.isEmpty()) filteredPlans = plans;

        // Simple scoring logic
        List<ScoredPlan> scoredPlans = filteredPlans.stream()
                .map(p -> new ScoredPlan(p, scorePlan(p, request)))
                .sorted(Comparator.comparingDouble(s -> s.score))
                .collect(Collectors.toList());

        PlanAdvisorResponseDTO response = new PlanAdvisorResponseDTO();
        ScoredPlan best = scoredPlans.get(0);
        response.setRecommendedPlanId(best.plan.id);
        response.setRecommendedPlanName(best.plan.name);
        response.setReason("Based on your budget and service preferences, this plan offers the best value.");
        response.setMatchSummary("Matches " + (request.getServiceType() != null ? request.getServiceType() : "general") + " requirements.");
        response.setRecommendationMode("FALLBACK");
        response.setDisclaimer("Recommendation based on local algorithm.");

        if (scoredPlans.size() > 1) {
            ScoredPlan alt = scoredPlans.get(1);
            response.setAlternatives(List.of(
                    new PlanAdvisorResponseDTO.AlternativePlanDTO(alt.plan.id, alt.plan.name, "A great alternative that fits your budget.")
            ));
        }

        return response;
    }

    private double scorePlan(CompactPlan plan, PlanAdvisorRequestDTO request) {
        double score = 0;

        // Budget scoring (closer to budget is better, but exceeding budget is penalized more)
        if (request.getMonthlyBudget() != null) {
            double diff = plan.price - request.getMonthlyBudget();
            if (diff > 0) {
                score += diff * 2.0; // penalty for over budget
            } else {
                score += Math.abs(diff) * 0.5; // smaller penalty for being under budget
            }
        }

        // Priority scoring
        if ("lowest_price".equalsIgnoreCase(request.getPriority())) {
            score += plan.price * 1.0;
        } else if ("most_data".equalsIgnoreCase(request.getPriority())) {
            // Find data feature
            String dataVal = plan.features.getOrDefault("Data", "0");
            try {
                double gb = Double.parseDouble(dataVal.replaceAll("[^0-9.]", ""));
                score -= gb * 2.0; // higher data reduces score (better)
            } catch (Exception ignored) {}
        }

        return score;
    }

    private PlanAdvisorResponseDTO createEmptyResponse() {
        PlanAdvisorResponseDTO res = new PlanAdvisorResponseDTO();
        res.setReason("No plans available at the moment.");
        res.setRecommendationMode("FALLBACK");
        return res;
    }

    // --- Helper Classes ---

    private static class CompactPlan {
        public int id;
        public String name;
        public double price;
        public String tagline;
        public String serviceType;
        public Map<String, String> features = new HashMap<>();

        public CompactPlan(PlanRepository.PlanRow p, List<PlanRepository.PlanFeatureRow> features) {
            this.id = p.planId();
            this.name = p.planName();
            this.price = p.monthlyPrice();
            this.tagline = p.tagline();
            this.serviceType = p.serviceType();
            for (PlanRepository.PlanFeatureRow f : features) {
                this.features.put(f.featureName(), f.featureValue() + (f.unit() != null ? " " + f.unit() : ""));
            }
        }
    }

    private static class ScoredPlan {
        public CompactPlan plan;
        public double score;

        public ScoredPlan(CompactPlan plan, double score) {
            this.plan = plan;
            this.score = score;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class AiResponse {
        public List<Choice> choices;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class Choice {
        public Message message;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class Message {
        public String content;
    }
}
