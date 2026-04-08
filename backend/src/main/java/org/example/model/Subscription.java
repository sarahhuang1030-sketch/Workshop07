package org.example.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SubscriptionId")
    private Integer subscriptionId;

    @Column(name = "CustomerId")
    private Integer customerId;

    @Column(name = "PlanId")
    private Integer planId;

    @Column(name = "StartDate")
    private LocalDate startDate;

    @Column(name = "EndDate")
    private LocalDate endDate;

    @Column(name = "Status")
    private String status;
//    private String lifecycleStage;

    @Column(name = "BillingCycleDay")
    private Integer billingCycleDay;

    @Column(name = "Notes")
    private String notes;

    @Column(name = "SoldByEmployeeId")
    private Integer soldByEmployeeId;


    @Transient
    private Customer customer;

    @Transient
    private Plan plan;

    @Transient
    private List<SubscriptionAddOn> subscriptionAddOns;

    // getter & setter

    public Subscription() {
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Plan getPlan() {
        return plan;
    }

    public void setPlan(Plan plan) {
        this.plan = plan;
    }

    public List<SubscriptionAddOn> getSubscriptionAddOns() {
        return subscriptionAddOns;
    }

    public void setSubscriptionAddOns(List<SubscriptionAddOn> subscriptionAddOns) {
        this.subscriptionAddOns = subscriptionAddOns;
    }

    public Integer getSoldByEmployeeId() {
        return soldByEmployeeId;
    }

    public void setSoldByEmployeeId(Integer soldByEmployeeId) {
        this.soldByEmployeeId = soldByEmployeeId;
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

    public String getStatus() { return status; }

    public void setStatus(String status) { this.status = status; }

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

//    public String getLifecycleStage() {
//        return lifecycleStage;
//    }
//
//    public void setLifecycleStage(String lifecycleStage) {
//        this.lifecycleStage = lifecycleStage;
//    }
}
