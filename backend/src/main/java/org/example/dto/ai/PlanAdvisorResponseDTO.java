package org.example.dto.ai;

import java.util.List;

public class PlanAdvisorResponseDTO {

    private Integer recommendedPlanId;
    private String recommendedPlanName;
    private String reason;
    private String matchSummary;

    private List<AlternativePlanDTO> alternatives;

    private String recommendationMode; // AI or FALLBACK
    private String disclaimer;

    public static class AlternativePlanDTO {
        private Integer planId;
        private String planName;
        private String reason;

        public AlternativePlanDTO() {}

        public AlternativePlanDTO(Integer planId, String planName, String reason) {
            this.planId = planId;
            this.planName = planName;
            this.reason = reason;
        }

        public Integer getPlanId() { return planId; }
        public void setPlanId(Integer planId) { this.planId = planId; }

        public String getPlanName() { return planName; }
        public void setPlanName(String planName) { this.planName = planName; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public Integer getRecommendedPlanId() {
        return recommendedPlanId;
    }

    public void setRecommendedPlanId(Integer recommendedPlanId) {
        this.recommendedPlanId = recommendedPlanId;
    }

    public String getRecommendedPlanName() {
        return recommendedPlanName;
    }

    public void setRecommendedPlanName(String recommendedPlanName) {
        this.recommendedPlanName = recommendedPlanName;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getMatchSummary() {
        return matchSummary;
    }

    public void setMatchSummary(String matchSummary) {
        this.matchSummary = matchSummary;
    }

    public List<AlternativePlanDTO> getAlternatives() {
        return alternatives;
    }

    public void setAlternatives(List<AlternativePlanDTO> alternatives) {
        this.alternatives = alternatives;
    }

    public String getRecommendationMode() {
        return recommendationMode;
    }

    public void setRecommendationMode(String recommendationMode) {
        this.recommendationMode = recommendationMode;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }
}
