package org.example.dto;

//for worshop06 getting plans for usage page


import java.math.BigDecimal;
import java.time.LocalDate;

public class CurrentPlanItemResponse {
    private Integer subscriptionId;
    private Integer planId;
    private String planName;
    private BigDecimal monthlyPrice;
    private BigDecimal addonTotal;
    private BigDecimal totalMonthlyPrice;
    private LocalDate startDate;
    private Integer contractTermMonths;
    private LocalDate endDate;

    public CurrentPlanItemResponse(Integer subscriptionId,
                                   Integer planId,
                                   String planName,
                                   BigDecimal monthlyPrice,
                                   BigDecimal addonTotal,
                                   BigDecimal totalMonthlyPrice,
                                   LocalDate startDate,
                                   Integer contractTermMonths,
                                   LocalDate endDate) {
        this.subscriptionId = subscriptionId;
        this.planId = planId;
        this.planName = planName;
        this.monthlyPrice = monthlyPrice;
        this.addonTotal = addonTotal;
        this.totalMonthlyPrice = totalMonthlyPrice;
        this.startDate = startDate;
        this.contractTermMonths = contractTermMonths;
        this.endDate = endDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getContractTermMonths() {
        return contractTermMonths;
    }

    public void setContractTermMonths(Integer contractTermMonths) {
        this.contractTermMonths = contractTermMonths;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
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

    public BigDecimal getMonthlyPrice() {
        return monthlyPrice;
    }

    public BigDecimal getAddonTotal() {
        return addonTotal;
    }

    public BigDecimal getTotalMonthlyPrice() {
        return totalMonthlyPrice;
    }

    public LocalDate getStartDate() {
        return startDate;
    }
}
