package org.example.dto;

public record ManagerAddOnDTO(
        Integer addOnId,
        Integer serviceTypeId,
        String addOnName,
        Double monthlyPrice,
        String description,
        Boolean isActive,
        String iconKey,
        String themeKey
) {}
