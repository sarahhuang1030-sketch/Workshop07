package org.example.dto;

public record ManagerPlanDTO(
        Integer planId,
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