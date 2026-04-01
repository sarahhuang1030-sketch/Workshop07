package org.example.dto;

public class EmployeeDashboardDTO {
    private String firstName;
    private int activeBranches;
    private int availableAddons;
    private int activeSubscriptions;
    private int pendingInvoices;
    private int recentLogs;
    private int planFeatures;

    public EmployeeDashboardDTO() {}

    public EmployeeDashboardDTO(String firstName,
                                int activeBranches,
                                int availableAddons,
                                int activeSubscriptions,
                                int pendingInvoices,
                                int recentLogs,
                                int planFeatures) {
        this.firstName = firstName;
        this.activeBranches = activeBranches;
        this.availableAddons = availableAddons;
        this.activeSubscriptions = activeSubscriptions;
        this.pendingInvoices = pendingInvoices;
        this.recentLogs = recentLogs;
        this.planFeatures = planFeatures;
    }

    public int getPlanFeatures() {
        return planFeatures;
    }

    public void setPlanFeatures(int planFeatures) {
        this.planFeatures = planFeatures;
    }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public int getActiveBranches() { return activeBranches; }
    public void setActiveBranches(int activeBranches) { this.activeBranches = activeBranches; }

    public int getAvailableAddons() { return availableAddons; }
    public void setAvailableAddons(int availableAddons) { this.availableAddons = availableAddons; }

    public int getActiveSubscriptions() { return activeSubscriptions; }
    public void setActiveSubscriptions(int activeSubscriptions) { this.activeSubscriptions = activeSubscriptions; }

    public int getPendingInvoices() { return pendingInvoices; }
    public void setPendingInvoices(int pendingInvoices) { this.pendingInvoices = pendingInvoices; }

    public int getRecentLogs() { return recentLogs; }
    public void setRecentLogs(int recentLogs) { this.recentLogs = recentLogs; }
}