package org.example.dto;

import java.time.LocalDateTime;

public class ServiceAppointmentDTO {
    private Integer appointmentId;
    private Integer requestId;
    private Integer technicianUserId;
    private Integer addressId;
    private String locationType;
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;
    private String status;
    private String notes;
    private String addressText;

    // Getters and Setters
    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }
    public Integer getRequestId() { return requestId; }
    public void setRequestId(Integer requestId) { this.requestId = requestId; }
    public Integer getTechnicianUserId() { return technicianUserId; }
    public void setTechnicianUserId(Integer technicianUserId) { this.technicianUserId = technicianUserId; }
    public Integer getAddressId() { return addressId; }
    public void setAddressId(Integer addressId) { this.addressId = addressId; }
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
    public String getAddressText() { return addressText; }
    public void setAddressText(String addressText) { this.addressText = addressText; }
}
