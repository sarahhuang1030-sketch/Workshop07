package org.example.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO: Represents one sales record (subscription-level detail)
 */
public class EmployeeSalesDetailDTO {

    private Integer subscriptionId;
    private Integer customerId;
    private String customerName;
    private Integer planId;
    private String status;
    private String planName;
    private BigDecimal monthlyPrice;
    private BigDecimal addonTotal;
    private LocalDate startDate;

    public EmployeeSalesDetailDTO() {
    }

    public EmployeeSalesDetailDTO(Integer subscriptionId,
                                  Integer customerId,
                                  String customerName,
                                  Integer planId,
                                  String status,
                                  String planName,
                                  BigDecimal monthlyPrice,
                                  BigDecimal addonTotal,
                                  LocalDate startDate) {
        this.subscriptionId = subscriptionId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.planId = planId;
        this.status = status;
        this.planName = planName;
        this.monthlyPrice = monthlyPrice;
        this.addonTotal = addonTotal;
        this.startDate = startDate;
    }

    public Integer getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(Integer subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Integer getPlanId() {
        return planId;
    }

    public void setPlanId(Integer planId) {
        this.planId = planId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public BigDecimal getMonthlyPrice() {
        return monthlyPrice;
    }

    public void setMonthlyPrice(BigDecimal monthlyPrice) {
        this.monthlyPrice = monthlyPrice;
    }

    public BigDecimal getAddonTotal() {
        return addonTotal;
    }

    public void setAddonTotal(BigDecimal addonTotal) {
        this.addonTotal = addonTotal;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
}