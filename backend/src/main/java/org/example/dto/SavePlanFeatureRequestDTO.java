package org.example.dto;

public record SavePlanFeatureRequestDTO(
        Integer planId,
        String featureName,
        String featureValue,
        String unit,
        Integer sortOrder
) {}