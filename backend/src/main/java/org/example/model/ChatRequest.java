package org.example.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chatrequests")
public class ChatRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RequestId")
    private Integer requestId;

    @Column(name = "CustomerUserId", nullable = false)
    private Integer customerUserId;

    @Column(name = "AssignedEmployeeUserId")
    private Integer assignedEmployeeUserId;

    @Column(name = "ConversationId")
    private Integer conversationId;

    @Column(name = "Reason")
    private String reason;

    @Column(name = "Comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "Status", nullable = false)
    private String status = "PENDING";

    @Column(name = "RequestedAt", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "AcceptedAt")
    private LocalDateTime acceptedAt;

    @Column(name = "ClosedAt")
    private LocalDateTime closedAt;

    public Integer getRequestId() {
        return requestId;
    }

    public void setRequestId(Integer requestId) {
        this.requestId = requestId;
    }

    public Integer getCustomerUserId() {
        return customerUserId;
    }

    public void setCustomerUserId(Integer customerUserId) {
        this.customerUserId = customerUserId;
    }

    public Integer getAssignedEmployeeUserId() {
        return assignedEmployeeUserId;
    }

    public void setAssignedEmployeeUserId(Integer assignedEmployeeUserId) {
        this.assignedEmployeeUserId = assignedEmployeeUserId;
    }

    public Integer getConversationId() {
        return conversationId;
    }

    public void setConversationId(Integer conversationId) {
        this.conversationId = conversationId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }
}