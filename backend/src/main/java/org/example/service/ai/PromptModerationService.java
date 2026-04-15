package org.example.service.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class PromptModerationService {

    private static final Logger logger = LoggerFactory.getLogger(PromptModerationService.class);

    // Fast local rule checks first
    private static final List<Pattern> HATE_PATTERNS = List.of(
            Pattern.compile("\\b(kill all|hate all|destroy all)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(all\\s+(people|group|them)\\s+should\\s+(die|suffer))\\b", Pattern.CASE_INSENSITIVE)
    );

    private static final List<Pattern> VIOLENCE_PATTERNS = List.of(
            Pattern.compile("\\b(kill|attack|harm|hurt)\\s+(people|them|others)\\b", Pattern.CASE_INSENSITIVE)
    );

    private static final List<Pattern> ABUSE_PATTERNS = List.of(
            Pattern.compile("\\b(idiot|stupid|trash)\\b", Pattern.CASE_INSENSITIVE)
    );

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.api.key:}")
    private String apiKey;

    @Value("${ai.api.url:}")
    private String apiUrl;

    @Value("${ai.moderation.model:gemini-2.5-flash}")
    private String moderationModel;

    public PromptModerationService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public PromptModerationResult moderate(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return PromptModerationResult.allowed();
        }

        String normalized = normalize(prompt);

        PromptModerationResult localResult = moderateWithRules(normalized);
        if (!localResult.isAllowed()) {
            return localResult;
        }

        if (!isAiModerationConfigured()) {
            return PromptModerationResult.allowed();
        }

        try {
            return moderateWithAi(prompt);
        } catch (Exception e) {
            logger.error("AI moderation failed. Falling back to local rules only. {}", e.getMessage(), e);
            return PromptModerationResult.allowed();
        }
    }

    private PromptModerationResult moderateWithRules(String normalized) {
        for (Pattern pattern : HATE_PATTERNS) {
            if (pattern.matcher(normalized).find()) {
                return PromptModerationResult.blocked(
                        "Please rephrase your request without hateful or harmful language.",
                        "HATE_SPEECH"
                );
            }
        }

        for (Pattern pattern : VIOLENCE_PATTERNS) {
            if (pattern.matcher(normalized).find()) {
                return PromptModerationResult.blocked(
                        "Your request contains harmful or violent language. Please rephrase.",
                        "VIOLENCE"
                );
            }
        }

        for (Pattern pattern : ABUSE_PATTERNS) {
            if (pattern.matcher(normalized).find()) {
                return PromptModerationResult.blocked(
                        "Please keep your request respectful and appropriate.",
                        "ABUSE"
                );
            }
        }

        return PromptModerationResult.allowed();
    }

    private boolean isAiModerationConfigured() {
        return apiKey != null && !apiKey.isBlank()
                && apiUrl != null && !apiUrl.isBlank()
                && moderationModel != null && !moderationModel.isBlank();
    }

    private PromptModerationResult moderateWithAi(String prompt) throws Exception {
        String systemPrompt = """
                You are a strict content moderation classifier for a telecom plan advisor.
                Your job is to classify whether a user prompt is safe to process.

                Return ONLY valid JSON with this exact shape:
                {
                  "allowed": true,
                  "category": "SAFE",
                  "message": null
                }

                Rules:
                - allowed = false if the prompt contains hate speech, abusive targeting, or violent harmful language.
                - allowed = true for ordinary frustration, telecom complaints, pricing complaints, or harmless negative opinions.
                - Do not explain your reasoning.
                - Do not return markdown.
                - category must be one of: SAFE, HATE_SPEECH, VIOLENCE, ABUSE
                - message should be null when allowed = true
                - message should be a short safe user-facing message when allowed = false
                """;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", Map.of(
                "parts", List.of(
                        Map.of("text", systemPrompt)
                )
        ));
        body.put("contents", List.of(
                Map.of(
                        "parts", List.of(
                                Map.of("text", prompt)
                        )
                )
        ));
        body.put("generationConfig", Map.of(
                "temperature", 0.0,
                "responseMimeType", "application/json"
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        String url = String.format(apiUrl, moderationModel);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
            throw new RuntimeException("Moderation API returned status " + response.getStatusCode());
        }

        GeminiResponse geminiResponse = objectMapper.readValue(response.getBody(), GeminiResponse.class);

        if (geminiResponse.candidates == null
                || geminiResponse.candidates.isEmpty()
                || geminiResponse.candidates.get(0).content == null
                || geminiResponse.candidates.get(0).content.parts == null
                || geminiResponse.candidates.get(0).content.parts.isEmpty()
                || geminiResponse.candidates.get(0).content.parts.get(0).text == null) {
            throw new RuntimeException("Moderation response missing text content");
        }

        String content = extractJson(geminiResponse.candidates.get(0).content.parts.get(0).text);
        AiModerationResponse moderationResponse = objectMapper.readValue(content, AiModerationResponse.class);

        if (moderationResponse.allowed) {
            return PromptModerationResult.allowed();
        }

        String category = moderationResponse.category == null || moderationResponse.category.isBlank()
                ? "ABUSE"
                : moderationResponse.category;

        String message = moderationResponse.message == null || moderationResponse.message.isBlank()
                ? "Please rephrase your request so it stays respectful and safe."
                : moderationResponse.message;

        return PromptModerationResult.blocked(message, category);
    }

    private String extractJson(String content) {
        if (content == null || content.isBlank()) {
            throw new RuntimeException("Moderation response content is empty");
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
            throw new RuntimeException("Moderation response does not contain valid JSON");
        }

        return trimmed.substring(firstBrace, lastBrace + 1);
    }

    private String normalize(String input) {
        return input
                .toLowerCase()
                .replaceAll("\\s+", " ")
                .trim();
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

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class AiModerationResponse {
        public boolean allowed;
        public String category;
        public String message;
    }
}