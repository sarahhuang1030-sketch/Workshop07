package org.example.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "servicerequests")
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RequestId")
    private Integer requestId;

    @Column(name = "CustomerId")
    private Integer customerId;

    @Column(name = "CreatedByUserId")
    private Integer createdByUserId;

    @Column(name = "AssignedTechnicianUserId")
    private Integer assignedTechnicianUserId;

    @Column(name = "ParentRequestId")
    private Integer parentRequestId;

    @Column(name = "RequestType")
    private String requestType;

    public enum Priority {
        Low,
        Medium,
        High
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "Priority")
    private Priority priority;

    @Column(name = "Status")
    private String status;

    @Column(name = "Description")
    private String description;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt;

    @Column(name = "UpdatedAt")
    private LocalDateTime updatedAt;

    public Integer getRequestId() {
        return requestId;
    }

    public void setRequestId(Integer requestId) {
        this.requestId = requestId;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public Integer getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Integer createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public Integer getAssignedTechnicianUserId() {
        return assignedTechnicianUserId;
    }

    public void setAssignedTechnicianUserId(Integer assignedTechnicianUserId) {
        this.assignedTechnicianUserId = assignedTechnicianUserId;
    }

    public Integer getParentRequestId() {
        return parentRequestId;
    }

    public void setParentRequestId(Integer parentRequestId) {
        this.parentRequestId = parentRequestId;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}