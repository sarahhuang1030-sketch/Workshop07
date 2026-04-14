package org.example.dto;

import java.math.BigDecimal;

public class ManagerSummaryDTO {

    private int customers;
    private int activeSubs;
    private BigDecimal monthlyRevenue;
    private int pastDue;
    private long addOns;
    private long planFeatures;
    private long location;
    private long serviceRequests;
    private long serviceAppointments;




    public long getServiceRequests() {
        return serviceRequests;
    }

    public void setServiceRequests(long serviceRequests) {
        this.serviceRequests = serviceRequests;
    }

    public long getServiceAppointments() {
        return serviceAppointments;
    }

    public void setServiceAppointments(long serviceAppointments) {
        this.serviceAppointments = serviceAppointments;
    }
    public long getLocation() {
        return location;
    }

    public void setLocation(long location) {
        this.location = location;
    }


    public ManagerSummaryDTO() {}

    public ManagerSummaryDTO(
            int customers,
            int activeSubs,
            BigDecimal monthlyRevenue,
            int pastDue,
            long addOns,
            long planFeatures,
            long location,
            long serviceRequests,
            long serviceAppointments


    ) {
        this.customers = customers;
        this.activeSubs = activeSubs;
        this.monthlyRevenue = monthlyRevenue;
        this.pastDue = pastDue;
        this.addOns = addOns;
        this.planFeatures = planFeatures;
        this.location = location;
        this.serviceRequests = serviceRequests;
        this.serviceAppointments = serviceAppointments;


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