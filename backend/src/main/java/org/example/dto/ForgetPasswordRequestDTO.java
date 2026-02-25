package org.example.dto;

import jakarta.validation.constraints.NotBlank;

public class ForgetPasswordRequestDTO {
    private String identifier;
    public void setIdentifier(String identifier) { this.identifier = identifier; }
    public String getIdentifier() { return identifier; }

    public ForgetPasswordRequestDTO() {}

}
