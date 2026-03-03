/**
 Description: This DTO class is used for handling login requests.
 It contains the username and password fields that a user would provide when attempting
 to log in. This class serves as a data transfer object between the client and server during the
 authentication process.

 Created by: Sarah
 Created on: February 2026
 **/

package org.example.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequestDTO {
    @NotBlank
    private String username;

    @NotBlank
    private String password;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
