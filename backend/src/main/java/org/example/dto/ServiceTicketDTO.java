package org.example.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ServiceTicketDTO {
    private Integer requestId;
    private String customerName;
    private String requestType;
    private String status;
    private String priority;
    private LocalDateTime createdAt;
    private String description;
    private String addressText;
    private List<CustomerServiceAppointmentDTO> appointments;

    // Getters and Setters
    public Integer getRequestId() { return requestId; }
    public void setRequestId(Integer requestId) { this.requestId = requestId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAddressText() { return addressText; }
    public void setAddressText(String addressText) { this.addressText = addressText; }

    public List<CustomerServiceAppointmentDTO> getAppointments() { return appointments; }
    public void setAppointments(List<CustomerServiceAppointmentDTO> appointments) { this.appointments = appointments; }
}
