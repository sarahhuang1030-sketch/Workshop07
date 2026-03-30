package org.example.dto;

public class CurrentPlanResponseDTO {
    private Integer subscriptionId;
    private Integer customerId;
    private Integer planId;
    private String status;
    private String planName;
    private Double monthlyPrice;
    private Double addonTotal;
    private Double totalMonthlyPrice;

    public CurrentPlanResponseDTO(
            Integer subscriptionId,
            Integer customerId,
            Integer planId,
            String status,
            String planName,
            Double totalMonthlyPrice
    ) {
        this.subscriptionId = subscriptionId;
        this.customerId = customerId;
        this.planId = planId;
        this.status = status;
        this.planName = planName;
        this.totalMonthlyPrice = totalMonthlyPrice;
    }

    public Integer getSubscriptionId() {
        return subscriptionId;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public Integer getPlanId() {
        return planId;
    }

    public String getStatus() {
        return status;
    }

    public String getPlanName() {
        return planName;
    }

    public Double getMonthlyPrice() {
        return monthlyPrice;
    }

    public Double getAddonTotal() {
        return addonTotal;
    }

    public Double getTotalMonthlyPrice() {
        return totalMonthlyPrice;
    }

    public Double getTotalPrice() {
        return (monthlyPrice != null ? monthlyPrice : 0)
                + (addonTotal != null ? addonTotal : 0);
    }
}