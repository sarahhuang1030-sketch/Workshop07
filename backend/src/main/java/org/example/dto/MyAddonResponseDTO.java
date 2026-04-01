package org.example.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class MyAddonResponseDTO {
    private Integer subscriptionAddOnId;
    private Integer subscriptionId;
    private Integer addOnId;
    private String addOnName;
    private String description;
    private BigDecimal monthlyPrice;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;

    public MyAddonResponseDTO(Integer subscriptionAddOnId,
                              Integer subscriptionId,
                              Integer addOnId,
                              String addOnName,
                              String description,
                              BigDecimal monthlyPrice,
                              String status,
                              LocalDate startDate,
                              LocalDate endDate) {
        this.subscriptionAddOnId = subscriptionAddOnId;
        this.subscriptionId = subscriptionId;
        this.addOnId = addOnId;
        this.addOnName = addOnName;
        this.description = description;
        this.monthlyPrice = monthlyPrice;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public Integer getSubscriptionAddOnId() {
        return subscriptionAddOnId;
    }

    public Integer getSubscriptionId() {
        return subscriptionId;
    }

    public Integer getAddOnId() {
        return addOnId;
    }

    public String getAddOnName() {
        return addOnName;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getMonthlyPrice() {
        return monthlyPrice;
    }

    public String getStatus() {
        return status;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }
}
