package org.example.dto;

public record ManagerAddOnRequestDTO(
        Integer serviceTypeId,
        String addOnName,
        Double monthlyPrice,
        String description,
        Boolean isActive,
        String iconKey,
        String themeKey
) {}
