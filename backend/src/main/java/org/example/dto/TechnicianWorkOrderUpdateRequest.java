package org.example.dto;

import java.time.LocalDateTime;

public class TechnicianWorkOrderUpdateRequest {
    private String status;
    private LocalDateTime scheduledEnd;
    private String notes;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getScheduledEnd() { return scheduledEnd; }
    public void setScheduledEnd(LocalDateTime scheduledEnd) { this.scheduledEnd = scheduledEnd; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}