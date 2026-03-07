package org.example.dto;

import java.math.BigDecimal;

public class ManagerSummaryDTO {
    private int customers;
    private int activeSubs;
    private BigDecimal monthlyRevenue;
    private int pastDue;

    public ManagerSummaryDTO() {}

    public ManagerSummaryDTO(int customers, int activeSubs, BigDecimal monthlyRevenue, int pastDue) {
        this.customers = customers;
        this.activeSubs = activeSubs;
        this.monthlyRevenue = monthlyRevenue;
        this.pastDue = pastDue;
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
}
