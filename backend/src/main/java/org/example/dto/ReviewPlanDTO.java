package org.example.dto;

public class ReviewPlanDTO {
    private Integer subscriptionId;
    private Integer planId;
    private String planName;

    public ReviewPlanDTO(Integer subscriptionId, Integer planId, String planName) {
        this.subscriptionId = subscriptionId;
        this.planId = planId;
        this.planName = planName;
    }

    public Integer getSubscriptionId() {
        return subscriptionId;
    }

    public Integer getPlanId() {
        return planId;
    }

    public String getPlanName() {
        return planName;
    }
}