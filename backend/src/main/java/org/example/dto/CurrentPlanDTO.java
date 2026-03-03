package org.example.dto;
import java.time.LocalDate;


    public record CurrentPlanDTO(
            String status,
            String name,
            Double monthlyPrice,
            LocalDate startedAt
    ) {}

