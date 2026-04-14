package org.example.dto;

public record ServiceDashboardSummaryDTO(
        long assignedRequests,
        long openRequests,
        long todayAppointments,
        long completedRequests,
        long assignedAppointments
) {}