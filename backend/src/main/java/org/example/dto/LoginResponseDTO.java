package org.example.dto;

public class LoginResponseDTO {
    private Long customerId;
    private String firstName;
    private String username;

    public LoginResponseDTO(Long customerId, String firstName, String username) {
        this.customerId = customerId;
        this.firstName = firstName;
        this.username = username;
    }

    public Long getCustomerId() { return customerId; }
    public String getFirstName() { return firstName; }
    public String getUsername() { return username; }
}
