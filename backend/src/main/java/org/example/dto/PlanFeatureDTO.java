package org.example.dto;

public record PlanFeatureDTO (
        Integer featureId,
        Integer planId,
        String featureName,
        String featureValue,
        String unit,
         Integer sortOrder
){}
