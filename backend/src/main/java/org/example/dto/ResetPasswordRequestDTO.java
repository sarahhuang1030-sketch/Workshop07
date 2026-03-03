/**
 Description: This DTO class is used for handling password reset requests.
 It contains the token that was sent to the user's email and the new password they want to set.
 This class serves as a data transfer object between the client and server when a user wants to reset their
 password using the token they received.
 Created by: Sarah
 Created on: February 2026
 **/

package org.example.dto;

public class ResetPasswordRequestDTO {
    private String token;
    private String newPassword;

    public ResetPasswordRequestDTO(){}

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
