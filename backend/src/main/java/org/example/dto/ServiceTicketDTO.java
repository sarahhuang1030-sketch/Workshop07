package org.example.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO returned by GET /api/service/tickets (technician path).
 *
 * FIX: Added addressText field.
 *      convertToTicketDTO() in ServiceDashboardService never populated an address,
 *      so the Android app always received null and displayed "—".
 *      The field is populated by joining CustomerAddress on the customer's
 *      primary address (see ServiceDashboardService fix).
 */
public class ServiceTicketDTO {

    private Integer requestId;
    private Integer customerId;
    private Integer technicianUserId;
    private String  customerName;
    private String  technicianName;

    // FIX: new field — must be set in ServiceDashboardService#convertToTicketDTO()
    private String  addressText;

    private String  requestType;
    private String  priority;
    private String  status;
    private String  description;
    private LocalDateTime createdAt;

    private List<ServiceWorkOrderDTO> appointments;

    // -------------------------------------------------------------------------
    // Getters & Setters
    // -------------------------------------------------------------------------

    public Integer getRequestId()               { return requestId; }
    public void setRequestId(Integer v)         { this.requestId = v; }

    public Integer getCustomerId()              { return customerId; }
    public void setCustomerId(Integer v)        { this.customerId = v; }

    public Integer getTechnicianUserId()        { return technicianUserId; }
    public void setTechnicianUserId(Integer v)  { this.technicianUserId = v; }

    public String getCustomerName()             { return customerName; }
    public void setCustomerName(String v)       { this.customerName = v; }

    public String getTechnicianName()           { return technicianName; }
    public void setTechnicianName(String v)     { this.technicianName = v; }

    /** FIX: getter/setter for the new address field. */
    public String getAddressText()              { return addressText; }
    public void setAddressText(String v)        { this.addressText = v; }

    public String getRequestType()              { return requestType; }
    public void setRequestType(String v)        { this.requestType = v; }

    public String getPriority()                 { return priority; }
    public void setPriority(String v)           { this.priority = v; }

    public String getStatus()                   { return status; }
    public void setStatus(String v)             { this.status = v; }

    public String getDescription()              { return description; }
    public void setDescription(String v)        { this.description = v; }

    public LocalDateTime getCreatedAt()         { return createdAt; }
    public void setCreatedAt(LocalDateTime v)   { this.createdAt = v; }

    public List<ServiceWorkOrderDTO> getAppointments()          { return appointments; }
    public void setAppointments(List<ServiceWorkOrderDTO> v)    { this.appointments = v; }
}