package org.example.dto;

import java.time.LocalDateTime;

public class CustomerServiceRequestDTO {
    private Integer requestId;
    private String requestType;
    private String priority;
    private String status;
    private String description;
    private LocalDateTime createdAt;
    private String technicianName;

    // Getters and Setters
    public Integer getRequestId() { return requestId; }
    public void setRequestId(Integer requestId) { this.requestId = requestId; }

    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getTechnicianName() { return technicianName; }
    public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }
}
