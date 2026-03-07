package org.example.dto;

public record SaveManagerPlanRequestDTO(
        Integer serviceTypeId,
        String planName,
        Double monthlyPrice,
        Integer contractTermMonths,
        String description,
        Integer isActive,
        String tagline,
        String badge,
        String iconKey,
        String themeKey,
        String dataLabel
) {}