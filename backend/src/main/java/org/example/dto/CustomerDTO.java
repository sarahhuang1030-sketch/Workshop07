package org.example.dto;

import org.example.model.Customer;

import java.time.LocalDateTime;

public class CustomerDTO {

    private Integer customerId;
    private String customerType;
    private String firstName;
    private String lastName;
    private String businessName;
    private String email;
    private String homePhone;
    private String status;
    private LocalDateTime createdAt;
    private Integer assignedEmployeeId;

    public CustomerDTO() {
    }

    public CustomerDTO(Integer customerId,
                       String customerType,
                       String firstName,
                       String lastName,
                       String businessName,
                       String email,
                       String homePhone,
                       String status,
                       LocalDateTime createdAt,
                       Integer assignedEmployeeId) {
        this.customerId = customerId;
        this.customerType = customerType;
        this.firstName = firstName;
        this.lastName = lastName;
        this.businessName = businessName;
        this.email = email;
        this.homePhone = homePhone;
        this.status = status;
        this.createdAt = createdAt;
        this.assignedEmployeeId = assignedEmployeeId;
    }

    public static CustomerDTO fromEntity(Customer customer) {
        if (customer == null) return null;

        return new CustomerDTO(
                customer.getCustomerId(),
                customer.getCustomerType(),
                customer.getFirstName(),
                customer.getLastName(),
                customer.getBusinessName(),
                customer.getEmail(),
                customer.getHomePhone(),
                customer.getStatus(),
                customer.getCreatedAt(),
                customer.getAssignedEmployeeId()
        );
    }

    public String getDisplayName() {
        if ("Business".equalsIgnoreCase(customerType)) {
            return businessName != null && !businessName.isBlank()
                    ? businessName
                    : "Unnamed Business";
        }

        String fullName = ((firstName == null ? "" : firstName) + " "
                + (lastName == null ? "" : lastName)).trim();

        return fullName.isEmpty() ? "Unnamed Customer" : fullName;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public String getCustomerType() {
        return customerType;
    }

    public void setCustomerType(String customerType) {
        this.customerType = customerType;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getHomePhone() {
        return homePhone;
    }

    public void setHomePhone(String homePhone) {
        this.homePhone = homePhone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getAssignedEmployeeId() {
        return assignedEmployeeId;
    }

    public void setAssignedEmployeeId(Integer assignedEmployeeId) {
        this.assignedEmployeeId = assignedEmployeeId;
    }
}