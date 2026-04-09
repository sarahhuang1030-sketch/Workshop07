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
    void testFallbackRecommendation() {
        // Mock active plans
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
        assertEquals(1, response.getRecommendedPlanId()); // Basic Plan should be closer to 0 budget and lower price
        assertFalse(response.getAlternatives().isEmpty());
    }
}
