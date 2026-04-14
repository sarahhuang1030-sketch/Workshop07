package org.example.dto;

public class ChatRequestDTO {

    private Integer requestId;
    private Integer customerUserId;
    private Integer customerId;
    private Integer assignedEmployeeUserId;
    private Integer conversationId;
    private String customerName;
    private String reason;
    private String comment;
    private String status;
    private String requestedAt;
    private String acceptedAt;
    private String closedAt;

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

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
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

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
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

    public String getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(String requestedAt) {
        this.requestedAt = requestedAt;
    }

    public String getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(String acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public String getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(String closedAt) {
        this.closedAt = closedAt;
    }
}