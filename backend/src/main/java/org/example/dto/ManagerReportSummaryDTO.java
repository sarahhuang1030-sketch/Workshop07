package org.example.dto;

import java.math.BigDecimal;

public class ManagerReportSummaryDTO {
    private long totalCustomers;
    private long activeSubscriptions;
    private long suspendedSubscriptions;
    private long openInvoices;
    private BigDecimal estimatedMonthlyRevenue;
    private long totalAddons;
    private long activeAddons;

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getActiveSubscriptions() {
        return activeSubscriptions;
    }

    public void setActiveSubscriptions(long activeSubscriptions) {
        this.activeSubscriptions = activeSubscriptions;
    }

    public long getSuspendedSubscriptions() {
        return suspendedSubscriptions;
    }

    public void setSuspendedSubscriptions(long suspendedSubscriptions) {
        this.suspendedSubscriptions = suspendedSubscriptions;
    }

    public long getOpenInvoices() {
        return openInvoices;
    }

    public void setOpenInvoices(long openInvoices) {
        this.openInvoices = openInvoices;
    }

    public BigDecimal getEstimatedMonthlyRevenue() {
        return estimatedMonthlyRevenue;
    }

    public void setEstimatedMonthlyRevenue(BigDecimal estimatedMonthlyRevenue) {
        this.estimatedMonthlyRevenue = estimatedMonthlyRevenue;
    }

    public long getTotalAddons() {
        return totalAddons;
    }

    public void setTotalAddons(long totalAddons) {
        this.totalAddons = totalAddons;
    }

    public long getActiveAddons() {
        return activeAddons;
    }

    public void setActiveAddons(long activeAddons) {
        this.activeAddons = activeAddons;
    }
}

