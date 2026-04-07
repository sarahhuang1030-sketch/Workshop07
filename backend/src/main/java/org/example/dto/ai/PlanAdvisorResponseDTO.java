package org.example.dto.ai;

public class PlanAdvisorResponseDTO {

    private Integer recommendedPlanId;
    private String recommendedPlanName;
    private String reason;

    private Integer backupPlanId;
    private String backupPlanName;
    private String backupReason;

    private String disclaimer;

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

    public Integer getBackupPlanId() {
        return backupPlanId;
    }

    public void setBackupPlanId(Integer backupPlanId) {
        this.backupPlanId = backupPlanId;
    }

    public String getBackupPlanName() {
        return backupPlanName;
    }

    public void setBackupPlanName(String backupPlanName) {
        this.backupPlanName = backupPlanName;
    }

    public String getBackupReason() {
        return backupReason;
    }

    public void setBackupReason(String backupReason) {
        this.backupReason = backupReason;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }
}