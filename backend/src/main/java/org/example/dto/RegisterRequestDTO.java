package org.example.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class RegisterRequestDTO {

    @NotBlank public String customerType; // "individual" or "business"
    @NotBlank public String firstName;
    @NotBlank public String lastName;

    public String businessName;

    @NotBlank @Email public String email;
    @NotBlank public String homephone;

    // login fields (useraccounts)
    @NotBlank public String username;
    @NotBlank public String password;

    // Billing address (required)
    @NotBlank public String billingStreet1;
    public String billingStreet2;
    @NotBlank public String billingCity;
    @NotBlank public String billingProvince;
    @NotBlank public String billingPostalCode;
    @NotBlank public String billingCountry;

    // Service address (optional)
    public boolean sameAsBilling = true;
    public String serviceStreet1;
    public String serviceStreet2;
    public String serviceCity;
    public String serviceProvince;
    public String servicePostalCode;
    public String serviceCountry;
}
