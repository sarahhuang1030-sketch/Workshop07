package org.example.dto;
import java.util.List;

public record PlanDTO(
        int planId,
        String planName,
        double monthlyPrice,
        String tagline,
       // List<String> perks
        // structured: Data/Calling/Speed/etc. (excluding Perk)
        List<PlanFeatureDTO> features,

        // perks: FeatureName='Perk'
        List<String> perks,

        // optional
        List<AddOnDTO> addOns
) {}
