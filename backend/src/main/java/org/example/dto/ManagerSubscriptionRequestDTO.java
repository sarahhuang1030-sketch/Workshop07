package org.example.dto;

import java.time.LocalDate;
import java.util.List;

public class ManagerSubscriptionRequestDTO {
    private Integer customerId;
    private Integer planId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Integer billingCycleDay;
    private String notes;
    private List<Integer> addOnIds;

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public Integer getPlanId() {
        return planId;
    }

    public void setPlanId(Integer planId) {
        this.planId = planId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getBillingCycleDay() {
        return billingCycleDay;
    }

    public void setBillingCycleDay(Integer billingCycleDay) {
        this.billingCycleDay = billingCycleDay;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<Integer> getAddOnIds() {
        return addOnIds;
    }

    public void setAddOnIds(List<Integer> addOnIds) {
        this.addOnIds = addOnIds;
    }
}
