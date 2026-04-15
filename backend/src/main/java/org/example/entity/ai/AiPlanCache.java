package org.example.entity.ai;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_plan_cache")
public class AiPlanCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cache_id")
    private Long cacheId;

    @Column(name = "cache_key", nullable = false, unique = true, length = 500)
    private String cacheKey;

    @Lob
    @Column(name = "response_json", nullable = false, columnDefinition = "LONGTEXT")
    private String responseJson;

    @Column(name = "recommendation_mode", length = 50)
    private String recommendationMode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public Long getCacheId() {
        return cacheId;
    }

    public void setCacheId(Long cacheId) {
        this.cacheId = cacheId;
    }

    public String getCacheKey() {
        return cacheKey;
    }

    public void setCacheKey(String cacheKey) {
        this.cacheKey = cacheKey;
    }

    public String getResponseJson() {
        return responseJson;
    }

    public void setResponseJson(String responseJson) {
        this.responseJson = responseJson;
    }

    public String getRecommendationMode() {
        return recommendationMode;
    }

    public void setRecommendationMode(String recommendationMode) {
        this.recommendationMode = recommendationMode;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}