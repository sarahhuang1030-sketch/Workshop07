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
