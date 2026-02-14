package org.example.dto;

public class LoginResponseDTO {
    private Integer customerId;   // null if not a customer
    private Integer employeeId;   // null if not an employee
    private String firstName;
    private String username;
    private String role;

    public LoginResponseDTO(Integer customerId, Integer employeeId, String firstName, String username, String role) {
        this.customerId = customerId;
        this.employeeId = employeeId;
        this.firstName = firstName;
        this.username = username;
        this.role = role;
    }

    public Integer getCustomerId() { return customerId; }
    public Integer getEmployeeId() { return employeeId; }
    public String getFirstName() { return firstName; }
    public String getUsername() { return username; }
    public String getRole() { return role; }
}