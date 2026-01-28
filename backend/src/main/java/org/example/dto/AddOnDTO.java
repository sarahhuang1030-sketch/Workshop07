package org.example.dto;

public record AddOnDTO(
        int addOnId,
        String addOnName,
        double monthlyPrice,
        String description
) {}
