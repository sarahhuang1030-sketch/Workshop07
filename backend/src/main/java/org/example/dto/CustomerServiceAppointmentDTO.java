package org.example.dto;

import java.time.LocalDateTime;

public class CustomerServiceAppointmentDTO {
    private Integer appointmentId;
    private String locationType;
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;
    private String status;
    private String technicianName;

    // Getters and Setters
    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }

    public String getLocationType() { return locationType; }
    public void setLocationType(String locationType) { this.locationType = locationType; }

    public LocalDateTime getScheduledStart() { return scheduledStart; }
    public void setScheduledStart(LocalDateTime scheduledStart) { this.scheduledStart = scheduledStart; }

    public LocalDateTime getScheduledEnd() { return scheduledEnd; }
    public void setScheduledEnd(LocalDateTime scheduledEnd) { this.scheduledEnd = scheduledEnd; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTechnicianName() { return technicianName; }
    public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }
}
