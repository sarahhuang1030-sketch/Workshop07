package org.example.dto;

import java.math.BigDecimal;

public class ManagerSummaryDTO {

    private int customers;
    private int activeSubs;
    private BigDecimal monthlyRevenue;
    private int pastDue;

    private long addOns;
    private long planFeatures;

    public ManagerSummaryDTO() {}

    public ManagerSummaryDTO(
            int customers,
            int activeSubs,
            BigDecimal monthlyRevenue,
            int pastDue,
            long addOns,
            long planFeatures
    ) {
        this.customers = customers;
        this.activeSubs = activeSubs;
        this.monthlyRevenue = monthlyRevenue;
        this.pastDue = pastDue;
        this.addOns = addOns;
        this.planFeatures = planFeatures;
    }

    public int getCustomers() {
        return customers;
    }

    public void setCustomers(int customers) {
        this.customers = customers;
    }

    public int getActiveSubs() {
        return activeSubs;
    }

    public void setActiveSubs(int activeSubs) {
        this.activeSubs = activeSubs;
    }

    public BigDecimal getMonthlyRevenue() {
        return monthlyRevenue;
    }

    public void setMonthlyRevenue(BigDecimal monthlyRevenue) {
        this.monthlyRevenue = monthlyRevenue;
    }

    public int getPastDue() {
        return pastDue;
    }

    public void setPastDue(int pastDue) {
        this.pastDue = pastDue;
    }

    public long getAddOns() {
        return addOns;
    }

    public void setAddOns(long addOns) {
        this.addOns = addOns;
    }

    public long getPlanFeatures() {
        return planFeatures;
    }

    public void setPlanFeatures(long planFeatures) {
        this.planFeatures = planFeatures;
    }
}