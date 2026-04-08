package org.example.dto;

import java.time.LocalDateTime;

public class ServiceWorkOrderDTO {
    private Integer appointmentId;
    private Integer requestId;
    private String customerName;
    private String addressText;
    private String locationType;
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;
    private String status;
    private String notes;

    // Getters and Setters
    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }

    public Integer getRequestId() { return requestId; }
    public void setRequestId(Integer requestId) { this.requestId = requestId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getAddressText() { return addressText; }
    public void setAddressText(String addressText) { this.addressText = addressText; }

    public String getLocationType() { return locationType; }
    public void setLocationType(String locationType) { this.locationType = locationType; }

    public LocalDateTime getScheduledStart() { return scheduledStart; }
    public void setScheduledStart(LocalDateTime scheduledStart) { this.scheduledStart = scheduledStart; }

    public LocalDateTime getScheduledEnd() { return scheduledEnd; }
    public void setScheduledEnd(LocalDateTime scheduledEnd) { this.scheduledEnd = scheduledEnd; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
