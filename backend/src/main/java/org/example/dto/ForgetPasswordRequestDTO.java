/**
 Description: This DTO class is used for handling forget password requests.
 It contains the identifier field, which is the user's email or username.
 This class serves as a data transfer object between the client and server
 when a user wants to initiate the password reset process by providing their email or username.

 Created by: Sarah
 Created on: February 2026
 **/
package org.example.dto;

import jakarta.validation.constraints.NotBlank;

public class ForgetPasswordRequestDTO {
    private String identifier;
    public void setIdentifier(String identifier) { this.identifier = identifier; }
    public String getIdentifier() { return identifier; }

    public ForgetPasswordRequestDTO() {}

}
