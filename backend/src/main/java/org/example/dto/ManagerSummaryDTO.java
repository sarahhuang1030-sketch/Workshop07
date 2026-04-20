package org.example.dto;

import java.math.BigDecimal;

/**
 * DTO returned by GET /api/manager/summary.
 *
 * FIX: Added totalEmployees field.
 *      The field was missing, so the JSON never contained "totalEmployees",
 *      the Android ManagerSummaryResponse.getTotalEmployees() always returned 0,
 *      and the dashboard Employee card always displayed "0 employees".
 */
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

    // FIX: new field — must be set in ManagerService#getSummary()
    private long totalEmployees;

    // =========================================================================
    // Constructors
    // =========================================================================

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
            long serviceAppointments,
            long totalEmployees          // FIX: added parameter
    ) {
        this.customers           = customers;
        this.activeSubs          = activeSubs;
        this.monthlyRevenue      = monthlyRevenue;
        this.pastDue             = pastDue;
        this.addOns              = addOns;
        this.planFeatures        = planFeatures;
        this.location            = location;
        this.serviceRequests     = serviceRequests;
        this.serviceAppointments = serviceAppointments;
        this.totalEmployees      = totalEmployees;
    }

    // =========================================================================
    // Getters & Setters
    // =========================================================================

    public int getCustomers()                    { return customers; }
    public void setCustomers(int v)              { this.customers = v; }

    public int getActiveSubs()                   { return activeSubs; }
    public void setActiveSubs(int v)             { this.activeSubs = v; }

    public BigDecimal getMonthlyRevenue()        { return monthlyRevenue; }
    public void setMonthlyRevenue(BigDecimal v)  { this.monthlyRevenue = v; }

    public int getPastDue()                      { return pastDue; }
    public void setPastDue(int v)                { this.pastDue = v; }

    public long getAddOns()                      { return addOns; }
    public void setAddOns(long v)                { this.addOns = v; }

    public long getPlanFeatures()                { return planFeatures; }
    public void setPlanFeatures(long v)          { this.planFeatures = v; }

    public long getLocation()                    { return location; }
    public void setLocation(long v)              { this.location = v; }

    public long getServiceRequests()             { return serviceRequests; }
    public void setServiceRequests(long v)       { this.serviceRequests = v; }

    public long getServiceAppointments()         { return serviceAppointments; }
    public void setServiceAppointments(long v)   { this.serviceAppointments = v; }

    public long getTotalEmployees()              { return totalEmployees; }
    public void setTotalEmployees(long v)        { this.totalEmployees = v; }
}