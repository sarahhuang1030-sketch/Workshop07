package org.example.dto;

import ch.qos.logback.core.testUtil.StringListAppender;

public class LoginResponseDTO {

    private String token;   // JWT token

    private Integer customerId;   // null if not a customer
    private Integer employeeId;   // null if not an employee
    private String firstName;
    private String lastName;
    private String username;
    private String role;
    private Boolean mustChangePassword;

    public LoginResponseDTO(
            String token,
            Integer customerId,
            Integer employeeId,
            String firstName,
            String lastName,
            String username,
            String role,
            Boolean mustChangePassword
    ) {
        this.token = token;
        this.customerId = customerId;
        this.employeeId = employeeId;
        this.firstName = firstName;
        this.username = username;
        this.role = role;
        this.mustChangePassword= mustChangePassword;
        this.lastName = lastName;
    }

    public String getToken() { return token; }
    public Integer getCustomerId() { return customerId; }
    public Integer getEmployeeId() { return employeeId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getUsername() { return username; }
    public String getRole() { return role; }

    public Boolean getMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(Boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

}