package org.example.dto;

import java.util.List;

public record PlanWithAddOnsDTO(
        int planId,
        String planName,
        double monthlyPrice,
        String tagline,
        List<String> perks,
        List<AddOnDTO> addOns
) {}
