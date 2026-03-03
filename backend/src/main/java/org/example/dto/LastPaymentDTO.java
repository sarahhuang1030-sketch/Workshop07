package org.example.dto;

import java.time.LocalDateTime;

public record LastPaymentDTO(
        Double amount,
        LocalDateTime paymentDate,
        String method,
        String status
) {}
