/**
 Description: This DTO class is used for handling user registration requests.
 It contains all the necessary fields for registering a new customer, including personal information, login
 credentials, and address details. The class also includes validation annotations to ensure that the input
 data meets the required criteria before processing the registration.

 Created by: Sarah
 Created on: February 2026
 **/

package org.example.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;

public class RegisterRequestDTO {

    @NotBlank public String customerType; // "individual" or "business"
    @NotBlank public String firstName;
    @NotBlank public String lastName;

    public String businessName;

    @AssertTrue(message = "Business name is required for business customers")
    public boolean isBusinessNameValid() {
        if ("business".equalsIgnoreCase(customerType)) {
            return businessName != null && !businessName.trim().isEmpty();
        }
        return true;
    }

    @NotBlank @Email(message = "Invalid email")
    public String email;

    @NotBlank(message = "Home phone is required")
    public String homephone;

    // login fields (useraccounts)
    @NotBlank(message = "Username is required")
    public String username;
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    public String password;

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
