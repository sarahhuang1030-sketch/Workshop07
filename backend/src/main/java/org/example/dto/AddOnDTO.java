package org.example.dto;

public record AddOnDTO(
        int addOnId,
        int serviceTypeId,
        String addOnName,
        double monthlyPrice,
        String description
) {}