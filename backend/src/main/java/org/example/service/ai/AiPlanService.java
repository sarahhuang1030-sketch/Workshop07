package org.example.service.ai;

import org.example.service.ai.PromptModerationService;
import org.example.service.ai.PromptModerationResult;
import org.example.service.ai.UnsafePromptException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.dto.ai.PlanAdvisorRequestDTO;
import org.example.dto.ai.PlanAdvisorResponseDTO;
import org.example.entity.ai.AiPlanCache;
import org.example.repository.ai.AiPlanCacheRepository;
import org.example.repository.PlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiPlanService {

    private static final Logger logger = LoggerFactory.getLogger(AiPlanService.class);
    private static final int CACHE_TTL_DAYS = 7;

    private final PlanRepository repo;
    private final AiPlanCacheRepository cacheRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final PromptModerationService moderationService;

    @Value("${ai.api.key:}")
    private String apiKey;

    @Value("${ai.api.url:}")
    private String apiUrl;

    @Value("${ai.model:gemini-2.5-flash}")
    private String model;

    public AiPlanService(
            PlanRepository repo,
            AiPlanCacheRepository cacheRepository,
            PromptModerationService moderationService
    ) {
        this.repo = repo;
        this.cacheRepository = cacheRepository;
        this.moderationService = moderationService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public PlanAdvisorResponseDTO recommendPlan(PlanAdvisorRequestDTO request) {
        if (request == null) {
            request = new PlanAdvisorRequestDTO();
        }

        request.normalize();
        PromptModerationResult result = moderationService.moderate(request.getUserPrompt());

        if (!result.isAllowed()) {
            throw new UnsafePromptException(
                    result.getMessage(),
                    result.getCategory()
            );
        }

        String cacheKey = buildCacheKey(request);
        PlanAdvisorResponseDTO cached = tryGetCachedResponse(cacheKey);
        if (cached != null) {
            logger.info("Returning cached AI plan recommendation for key={}", cacheKey);
            cached.setRecommendationMode("AI_CACHED");
            cached.setDisclaimer("Recommendation served from cache to avoid an extra AI API call.");
            return cached;
        }

        List<PlanRepository.PlanRow> allPlans = repo.findAllPlans();
        if (allPlans == null || allPlans.isEmpty()) {
            return createEmptyResponse();
        }

        List<Integer> ids = allPlans.stream()
                .map(PlanRepository.PlanRow::planId)
                .collect(Collectors.toList());

        Map<Integer, List<PlanRepository.PlanFeatureRow>> featuresMap =
                repo.findPlanFeaturesByPlanIds(ids);

        List<CompactPlan> allCompactPlans = allPlans.stream()
                .map(p -> new CompactPlan(
                        p,
                        featuresMap.getOrDefault(p.planId(), Collections.emptyList())
                ))
                .collect(Collectors.toList());

        List<CompactPlan> candidates = filterCandidates(allCompactPlans, request);
        if (candidates.isEmpty()) {
            candidates = allCompactPlans;
        }

        List<ScoredPlan> scoredPlans = scorePlans(candidates, request);
        if (scoredPlans.isEmpty()) {
            return createEmptyResponse();
        }

        List<CompactPlan> topAiCandidates = scoredPlans.stream()
                .limit(8)
                .map(sp -> sp.plan)
                .collect(Collectors.toList());

        if (isAiConfigured()) {
            try {
                PlanAdvisorResponseDTO aiResponse = getAiRecommendation(request, topAiCandidates, scoredPlans);
                saveCache(cacheKey, aiResponse);
                return aiResponse;
            } catch (Exception e) {
                logger.error("AI recommendation failed, using fallback. {}", e.getMessage(), e);
            }
        } else {
            logger.warn("AI config missing. Using fallback recommendation.");
        }

        return buildFallbackResponse(request, scoredPlans);
    }

    private PlanAdvisorResponseDTO tryGetCachedResponse(String cacheKey) {
        try {
            cacheRepository.deleteByExpiresAtBefore(LocalDateTime.now());

            Optional<AiPlanCache> cacheOpt = cacheRepository.findByCacheKey(cacheKey);
            if (cacheOpt.isEmpty()) {
                return null;
            }

            AiPlanCache cache = cacheOpt.get();

            if (cache.getExpiresAt() != null && cache.getExpiresAt().isBefore(LocalDateTime.now())) {
                cacheRepository.delete(cache);
                return null;
            }

            return objectMapper.readValue(cache.getResponseJson(), PlanAdvisorResponseDTO.class);
        } catch (Exception e) {
            logger.warn("Failed to read cached response for key={}: {}", cacheKey, e.getMessage());
            return null;
        }
    }

    private void saveCache(String cacheKey, PlanAdvisorResponseDTO response) {
        try {
            if (response == null) {
                return;
            }

            if (!"AI".equalsIgnoreCase(response.getRecommendationMode())) {
                return;
            }

            AiPlanCache cache = cacheRepository.findByCacheKey(cacheKey)
                    .orElseGet(AiPlanCache::new);

            cache.setCacheKey(cacheKey);
            cache.setResponseJson(objectMapper.writeValueAsString(response));
            cache.setRecommendationMode(response.getRecommendationMode());
            cache.setCreatedAt(LocalDateTime.now());
            cache.setExpiresAt(LocalDateTime.now().plusDays(CACHE_TTL_DAYS));

            cacheRepository.save(cache);
        } catch (Exception e) {
            logger.warn("Failed to save AI plan cache for key={}: {}", cacheKey, e.getMessage());
        }
    }

    private String buildCacheKey(PlanAdvisorRequestDTO request) {
        return String.join("|",
                normalizeText(request.getServiceType()),
                normalizeNumber(request.getMonthlyBudget()),
                normalizeNumber(request.getNumberOfLines()),
                normalizeNumber(request.getEstimatedDataGb()),
                normalizeNumber(request.getEstimatedInternetSpeedMbps()),
                normalizeNumber(request.getHouseholdSize()),
                normalizeNumber(request.getConnectedDevices()),
                normalizeBoolean(request.getNeedsInternationalCalling()),
                normalizeBoolean(request.getNeedsHotspot()),
                normalizeBoolean(request.getHeavyStreaming()),
                normalizeText(request.getPriority()),
                normalizeText(request.getInputMode()),
                normalizeText(request.getUserPrompt())
        );
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeNumber(Integer value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String normalizeBoolean(Boolean value) {
        return value == null ? "" : String.valueOf(value);
    }

    private boolean isAiConfigured() {
        return apiKey != null && !apiKey.isBlank()
                && apiUrl != null && !apiUrl.isBlank()
                && model != null && !model.isBlank();
    }

    private List<CompactPlan> filterCandidates(List<CompactPlan> plans, PlanAdvisorRequestDTO request) {
        if (request.getServiceType() == null || request.getServiceType().isBlank()) {
            return plans;
        }

        return plans.stream()
                .filter(p -> p.serviceType != null && p.serviceType.equalsIgnoreCase(request.getServiceType()))
                .collect(Collectors.toList());
    }

    private List<ScoredPlan> scorePlans(List<CompactPlan> plans, PlanAdvisorRequestDTO request) {
        return plans.stream()
                .map(p -> new ScoredPlan(p, scorePlan(p, request)))
                .sorted((a, b) -> Double.compare(b.score, a.score))
                .collect(Collectors.toList());
    }

    private double scorePlan(CompactPlan plan, PlanAdvisorRequestDTO request) {
        double score = 0.0;

        String requestedService = lower(request.getServiceType());
        String planService = lower(plan.serviceType);
        String prompt = lower(request.getUserPrompt());
        String priority = lower(request.getPriority());

        if (requestedService != null) {
            if (requestedService.equals(planService)) {
                score += 40;
            } else {
                score -= 60;
            }
        }

        if (request.getMonthlyBudget() != null) {
            double budget = request.getMonthlyBudget();
            double diff = budget - plan.price;

            if (diff >= 0) {
                score += 25;
                score -= Math.abs(diff) * 0.12;
            } else {
                score -= Math.abs(diff) * 1.6;
            }
        }

        if ("mobile".equals(planService)) {
            if (request.getNumberOfLines() != null) {
                if (plan.maxLines == null || plan.maxLines >= request.getNumberOfLines()) {
                    score += 8;
                } else {
                    score -= 18;
                }
            }

            if (request.getEstimatedDataGb() != null && plan.dataGb != null) {
                if (plan.dataGb >= request.getEstimatedDataGb()) {
                    score += 18;
                } else {
                    score -= (request.getEstimatedDataGb() - plan.dataGb) * 0.9;
                }
            }

            if (Boolean.TRUE.equals(request.getNeedsHotspot())) {
                score += plan.hotspotIncluded ? 10 : -12;
            }

            if (Boolean.TRUE.equals(request.getNeedsInternationalCalling())) {
                score += plan.internationalCallingIncluded ? 10 : -12;
            }

            if (Boolean.TRUE.equals(request.getHeavyStreaming())) {
                if (plan.dataGb != null && plan.dataGb >= 50) {
                    score += 10;
                } else {
                    score -= 6;
                }
            }
        }

        if ("internet".equals(planService)) {
            if (request.getEstimatedInternetSpeedMbps() != null && plan.speedMbps != null) {
                if (plan.speedMbps >= request.getEstimatedInternetSpeedMbps()) {
                    score += 20;
                } else {
                    score -= (request.getEstimatedInternetSpeedMbps() - plan.speedMbps) * 0.06;
                }
            }

            if (request.getConnectedDevices() != null && plan.speedMbps != null) {
                if (request.getConnectedDevices() <= 5 && plan.speedMbps >= 100) score += 5;
                if (request.getConnectedDevices() >= 8 && plan.speedMbps >= 300) score += 10;
                if (request.getConnectedDevices() >= 12 && plan.speedMbps >= 500) score += 10;
            }

            if (Boolean.TRUE.equals(request.getHeavyStreaming())) {
                if (plan.speedMbps != null && plan.speedMbps >= 250) {
                    score += 12;
                } else {
                    score -= 8;
                }
            }
        }

        if ("lowest_price".equals(priority)) {
            score += Math.max(0, 30 - plan.price * 0.35);
        } else if ("most_data".equals(priority)) {
            if ("mobile".equals(planService) && plan.dataGb != null) {
                score += plan.dataGb * 0.5;
            }
            if ("internet".equals(planService) && plan.speedMbps != null) {
                score += plan.speedMbps * 0.03;
            }
        } else if ("family".equals(priority)) {
            if ("mobile".equals(planService)) {
                if (plan.maxLines == null || (request.getNumberOfLines() != null && plan.maxLines >= request.getNumberOfLines())) {
                    score += 10;
                }
            }
        } else {
            score += 8;
        }

        if (prompt != null) {
            if (prompt.contains("family") || prompt.contains("kids") || prompt.contains("lines")) {
                if ("mobile".equals(planService)) score += 8;
            }
            if (prompt.contains("travel") || prompt.contains("international")) {
                score += plan.internationalCallingIncluded ? 8 : -6;
            }
            if (prompt.contains("hotspot") || prompt.contains("tether")) {
                score += plan.hotspotIncluded ? 8 : -6;
            }
            if (prompt.contains("stream") || prompt.contains("netflix") || prompt.contains("youtube")) {
                if ("internet".equals(planService) && plan.speedMbps != null && plan.speedMbps >= 250) score += 8;
                if ("mobile".equals(planService) && plan.dataGb != null && plan.dataGb >= 50) score += 8;
            }
            if (prompt.contains("gaming") || prompt.contains("work from home") || prompt.contains("fast")) {
                if ("internet".equals(planService) && plan.speedMbps != null && plan.speedMbps >= 300) score += 12;
            }
            if (prompt.contains("cheap") || prompt.contains("budget") || prompt.contains("affordable")) {
                score += Math.max(0, 20 - plan.price * 0.25);
            }
        }

        return score;
    }

    private PlanAdvisorResponseDTO getAiRecommendation(
            PlanAdvisorRequestDTO request,
            List<CompactPlan> aiCandidates,
            List<ScoredPlan> fallbackRankedPlans
    ) throws Exception {

        String systemPrompt = """
                You are a telecom plan advisor.
                You must choose from ONLY the provided candidate plans.
                Return ONLY valid JSON with this exact shape:
                {
                  "recommendedPlanId": 1,
                  "recommendedPlanName": "string",
                  "reason": "string",
                  "matchSummary": "string",
                  "alternatives": [
                    { "planId": 2, "planName": "string", "reason": "string" }
                  ]
                }
                Rules:
                - Do not invent plans.
                - Pick only ids from the candidate list.
                - Alternatives must also come from the candidate list.
                - Keep reason concise and practical.
                - Do not wrap the JSON in markdown.
                """;

        Map<String, Object> userPayload = new LinkedHashMap<>();
        userPayload.put("request", request);
        userPayload.put("candidatePlans", aiCandidates);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", Map.of(
                "parts", List.of(
                        Map.of("text", systemPrompt)
                )
        ));
        body.put("contents", List.of(
                Map.of(
                        "parts", List.of(
                                Map.of("text", objectMapper.writeValueAsString(userPayload))
                        )
                )
        ));
        body.put("generationConfig", Map.of(
                "temperature", 0.2,
                "responseMimeType", "application/json"
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        String url = String.format(apiUrl, model);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
            throw new RuntimeException("Gemini API returned status " + response.getStatusCode());
        }

        GeminiResponse geminiResponse = objectMapper.readValue(response.getBody(), GeminiResponse.class);

        if (geminiResponse.candidates == null
                || geminiResponse.candidates.isEmpty()
                || geminiResponse.candidates.get(0).content == null
                || geminiResponse.candidates.get(0).content.parts == null
                || geminiResponse.candidates.get(0).content.parts.isEmpty()
                || geminiResponse.candidates.get(0).content.parts.get(0).text == null) {
            throw new RuntimeException("Gemini response missing text content");
        }

        String content = extractJson(geminiResponse.candidates.get(0).content.parts.get(0).text);
        PlanAdvisorResponseDTO result = objectMapper.readValue(content, PlanAdvisorResponseDTO.class);

        CompactPlan chosen = aiCandidates.stream()
                .filter(p -> Objects.equals(p.id, result.getRecommendedPlanId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Gemini returned an unknown plan id"));

        enrichMainRecommendation(result, chosen);
        result.setRecommendationMode("AI");
        result.setDisclaimer("AI-generated recommendation using Gemini based on your request and available plans.");

        if (result.getAlternatives() == null || result.getAlternatives().isEmpty()) {
            result.setAlternatives(buildAlternativeList(fallbackRankedPlans, chosen.id));
        }

        return result;
    }

    private String extractJson(String content) {
        if (content == null || content.isBlank()) {
            throw new RuntimeException("AI response content is empty");
        }

        String trimmed = content.trim();

        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7).trim();
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3).trim();
        }

        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3).trim();
        }

        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');

        if (firstBrace < 0 || lastBrace <= firstBrace) {
            throw new RuntimeException("AI response does not contain valid JSON");
        }

        return trimmed.substring(firstBrace, lastBrace + 1);
    }

    private PlanAdvisorResponseDTO buildFallbackResponse(PlanAdvisorRequestDTO request, List<ScoredPlan> scoredPlans) {
        ScoredPlan best = scoredPlans.get(0);

        PlanAdvisorResponseDTO response = new PlanAdvisorResponseDTO();
        response.setRecommendedPlanId(best.plan.id);
        response.setRecommendedPlanName(best.plan.name);
        response.setRecommendedMonthlyPrice(best.plan.price);
        response.setRecommendedServiceType(best.plan.serviceType);
        response.setReason(buildFallbackReason(best.plan, request));
        response.setMatchSummary(buildMatchSummary(best.plan, request));
        response.setRecommendationMode("FALLBACK");
        response.setDisclaimer("Recommendation based on local scoring because AI was unavailable or not used.");
        response.setAlternatives(buildAlternativeList(scoredPlans, best.plan.id));

        return response;
    }

    private void enrichMainRecommendation(PlanAdvisorResponseDTO response, CompactPlan plan) {
        response.setRecommendedPlanId(plan.id);
        response.setRecommendedPlanName(plan.name);
        response.setRecommendedMonthlyPrice(plan.price);
        response.setRecommendedServiceType(plan.serviceType);
    }

    private List<PlanAdvisorResponseDTO.AlternativePlanDTO> buildAlternativeList(List<ScoredPlan> scoredPlans, Integer chosenId) {
        return scoredPlans.stream()
                .filter(sp -> !Objects.equals(sp.plan.id, chosenId))
                .limit(2)
                .map(sp -> new PlanAdvisorResponseDTO.AlternativePlanDTO(
                        sp.plan.id,
                        sp.plan.name,
                        "Alternative option with a different price/performance balance."
                ))
                .collect(Collectors.toList());
    }

    private String buildFallbackReason(CompactPlan plan, PlanAdvisorRequestDTO request) {
        List<String> parts = new ArrayList<>();

        parts.add(plan.name + " was the strongest overall match");

        if (request.getMonthlyBudget() != null) {
            if (plan.price <= request.getMonthlyBudget()) {
                parts.add("it stays within your budget");
            } else {
                parts.add("it was still the closest fit to your budget");
            }
        }

        if ("mobile".equalsIgnoreCase(plan.serviceType) && plan.dataGb != null) {
            parts.add("it includes about " + trimDecimal(plan.dataGb) + " GB of data");
        }

        if ("internet".equalsIgnoreCase(plan.serviceType) && plan.speedMbps != null) {
            parts.add("it offers about " + trimDecimal(plan.speedMbps) + " Mbps speed");
        }

        if (plan.hotspotIncluded) {
            parts.add("it includes hotspot support");
        }

        if (plan.internationalCallingIncluded) {
            parts.add("it supports international calling");
        }

        return String.join(", ", parts) + ".";
    }

    private String buildMatchSummary(CompactPlan plan, PlanAdvisorRequestDTO request) {
        List<String> parts = new ArrayList<>();

        parts.add("Service: " + safe(plan.serviceType));
        parts.add("Price: $" + trimDecimal(plan.price) + "/mo");

        if ("mobile".equalsIgnoreCase(plan.serviceType) && plan.dataGb != null) {
            parts.add("Data: " + trimDecimal(plan.dataGb) + " GB");
        }

        if ("internet".equalsIgnoreCase(plan.serviceType) && plan.speedMbps != null) {
            parts.add("Speed: " + trimDecimal(plan.speedMbps) + " Mbps");
        }

        if (request.getNumberOfLines() != null && "mobile".equalsIgnoreCase(plan.serviceType)) {
            parts.add("Lines requested: " + request.getNumberOfLines());
        }

        return String.join(" • ", parts);
    }

    private PlanAdvisorResponseDTO createEmptyResponse() {
        PlanAdvisorResponseDTO res = new PlanAdvisorResponseDTO();
        res.setReason("No active plans are available at the moment.");
        res.setMatchSummary("The plan catalog returned no active entries.");
        res.setRecommendationMode("FALLBACK");
        res.setDisclaimer("No recommendation could be generated.");
        return res;
    }

    private String lower(String value) {
        return value == null ? null : value.toLowerCase(Locale.ROOT);
    }

    private String safe(String value) {
        return value == null ? "N/A" : value;
    }

    private String trimDecimal(Double value) {
        if (value == null) return "0";
        if (Math.floor(value) == value) {
            return String.valueOf(value.intValue());
        }
        return String.format(Locale.US, "%.1f", value);
    }

    private static class CompactPlan {
        public Integer id;
        public String name;
        public Double price;
        public String tagline;
        public String serviceType;

        public Double dataGb;
        public Double speedMbps;
        public Integer maxLines;
        public boolean hotspotIncluded;
        public boolean internationalCallingIncluded;

        public Map<String, String> features = new LinkedHashMap<>();

        public CompactPlan(PlanRepository.PlanRow p, List<PlanRepository.PlanFeatureRow> featureRows) {
            this.id = p.planId();
            this.name = p.planName();
            this.price = p.monthlyPrice();
            this.tagline = p.tagline();
            this.serviceType = p.serviceType();

            for (PlanRepository.PlanFeatureRow f : featureRows) {
                String featureName = f.featureName() == null ? "" : f.featureName().trim();
                String featureValue = f.featureValue() == null ? "" : f.featureValue().trim();
                String unit = f.unit() == null ? "" : f.unit().trim();

                String key = featureName.toLowerCase(Locale.ROOT);
                String combined = (featureValue + (unit.isBlank() ? "" : " " + unit)).trim();
                features.put(featureName, combined);

                Double numeric = parseDouble(featureValue);

                if (key.contains("data") && numeric != null) {
                    dataGb = numeric;
                }
                if ((key.contains("speed") || key.contains("mbps")) && numeric != null) {
                    speedMbps = numeric;
                }
                if (key.contains("line") && numeric != null) {
                    maxLines = numeric.intValue();
                }
                if (key.contains("hotspot")) {
                    hotspotIncluded = isTruthy(featureValue);
                }
                if (key.contains("international")) {
                    internationalCallingIncluded = isTruthy(featureValue);
                }
            }
        }

        private static Double parseDouble(String raw) {
            if (raw == null || raw.isBlank()) return null;
            String cleaned = raw.replaceAll("[^0-9.]", "");
            if (cleaned.isBlank()) return null;
            try {
                return Double.parseDouble(cleaned);
            } catch (Exception e) {
                return null;
            }
        }

        private static boolean isTruthy(String raw) {
            if (raw == null) return false;
            String v = raw.trim().toLowerCase(Locale.ROOT);
            return v.equals("yes") || v.equals("true") || v.equals("included") || v.equals("unlimited");
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
    private static class GeminiResponse {
        public List<GeminiCandidate> candidates;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiCandidate {
        public GeminiContent content;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiContent {
        public List<GeminiPart> parts;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiPart {
        public String text;
    }
}