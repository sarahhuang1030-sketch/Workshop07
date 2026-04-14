package org.example.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SubscriptionAddOnDTO {
    private Integer subscriptionAddOnId;
    private Integer addOnId;
    private String addOnName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private BigDecimal price;

    public Integer getSubscriptionAddOnId() {
        return subscriptionAddOnId;
    }

    public void setSubscriptionAddOnId(Integer subscriptionAddOnId) {
        this.subscriptionAddOnId = subscriptionAddOnId;
    }

    public Integer getAddOnId() {
        return addOnId;
    }

    public void setAddOnId(Integer addOnId) {
        this.addOnId = addOnId;
    }

    public String getAddOnName() {
        return addOnName;
    }

    public void setAddOnName(String addOnName) {
        this.addOnName = addOnName;
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }
}