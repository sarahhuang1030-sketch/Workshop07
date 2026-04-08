package org.example.dto;

public record ManagerPlanFeatureDTO(
        Integer featureId,
        Integer planId,
        String planName,
        String featureName,
        String featureValue,
        String unit,
        Integer sortOrder
) {}
