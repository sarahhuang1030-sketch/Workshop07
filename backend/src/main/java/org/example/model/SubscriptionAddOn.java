package org.example.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "subscriptionaddons")
public class SubscriptionAddOn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SubscriptionAddOnId")
    private Integer subscriptionAddOnId;

    @Column(name = "SubscriptionId")
    private Integer subscriptionId;

    @Column(name = "AddOnId")
    private Integer addOnId;

    @Column(name = "StartDate")
    private LocalDate startDate;

    @Column(name = "EndDate")
    private LocalDate endDate;

    @Column(name = "Status")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public Integer getAddOnId() {
        return addOnId;
    }

    public void setAddOnId(Integer addOnId) {
        this.addOnId = addOnId;
    }

    public Integer getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(Integer subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public Integer getSubscriptionAddOnId() {
        return subscriptionAddOnId;
    }

    public void setSubscriptionAddOnId(Integer subscriptionAddOnId) {
        this.subscriptionAddOnId = subscriptionAddOnId;
    }




}
