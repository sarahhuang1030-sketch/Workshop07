package org.example.dto;

import jakarta.validation.constraints.NotBlank;

public class ForgetPasswordRequestDTO {
    private String identifier;

    public ForgetPasswordRequestDTO() {}

    public String getIdentifier() { return identifier; }

}
