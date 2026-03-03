package org.example.dto;

public record MeResponseDTO(
        CurrentPlanDTO plan,
        LastPaymentDTO lastPayment // can be null
) {}
