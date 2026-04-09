package org.example.service.ai;

import org.example.dto.ai.PlanAdvisorRequestDTO;
import org.example.dto.ai.PlanAdvisorResponseDTO;
import org.example.repository.PlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

class AiPlanServiceTest {

    private PlanRepository repo;
    private AiPlanService service;

    @BeforeEach
    void setUp() {
        repo = Mockito.mock(PlanRepository.class);
        service = new AiPlanService(repo);
    }

    @Test
    void fallbackShouldChooseCheaperMobilePlanWithinBudget() {
        when(repo.findAllPlans()).thenReturn(List.of(
                new PlanRepository.PlanRow(1, "Basic Plan", 30.0, "Low cost", "Mobile"),
                new PlanRepository.PlanRow(2, "Premium Plan", 80.0, "High data", "Mobile")
        ));
        when(repo.findPlanFeaturesByPlanIds(anyList())).thenReturn(Collections.emptyMap());

        PlanAdvisorRequestDTO request = new PlanAdvisorRequestDTO();
        request.setInputMode("QUESTIONNAIRE");
        request.setServiceType("Mobile");
        request.setMonthlyBudget(40);
        request.setPriority("lowest_price");

        PlanAdvisorResponseDTO response = service.recommendPlan(request);

        assertNotNull(response);
        assertEquals("FALLBACK", response.getRecommendationMode());
        assertEquals(1, response.getRecommendedPlanId());
        assertNotNull(response.getAlternatives());
        assertFalse(response.getAlternatives().isEmpty());
    }

    @Test
    void fallbackShouldPreferInternetPlanWithHigherSpeedForStreaming() {
        when(repo.findAllPlans()).thenReturn(List.of(
                new PlanRepository.PlanRow(10, "Internet 100", 60.0, "Basic internet", "Internet"),
                new PlanRepository.PlanRow(11, "Internet 500", 85.0, "Fast internet", "Internet")
        ));

        when(repo.findPlanFeaturesByPlanIds(anyList())).thenReturn(
                java.util.Map.of(
                        10, List.of(new PlanRepository.PlanFeatureRow(10, "Speed", "100", "Mbps", 1, 1)),
                        11, List.of(new PlanRepository.PlanFeatureRow(11, "Speed", "500", "Mbps", 1, 2))
                )
        );

        PlanAdvisorRequestDTO request = new PlanAdvisorRequestDTO();
        request.setServiceType("Internet");
        request.setEstimatedInternetSpeedMbps(300);
        request.setHeavyStreaming(true);
        request.setPriority("best_value");

        PlanAdvisorResponseDTO response = service.recommendPlan(request);

        assertNotNull(response);
        assertEquals("FALLBACK", response.getRecommendationMode());
        assertEquals(11, response.getRecommendedPlanId());
    }

    @Test
    void shouldReturnEmptyResponseWhenNoPlansExist() {
        when(repo.findAllPlans()).thenReturn(Collections.emptyList());

        PlanAdvisorResponseDTO response = service.recommendPlan(new PlanAdvisorRequestDTO());

        assertNotNull(response);
        assertEquals("FALLBACK", response.getRecommendationMode());
        assertNull(response.getRecommendedPlanId());
        assertTrue(response.getReason().toLowerCase().contains("no active plans"));
    }
}