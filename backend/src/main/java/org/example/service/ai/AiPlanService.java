package org.example.service.ai;

import org.example.dto.PlanDTO;
import org.example.dto.ai.PlanAdvisorRequestDTO;
import org.example.dto.ai.PlanAdvisorResponseDTO;
import org.example.repository.PlanRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class AiPlanService {

    private final PlanRepository repo;

    public AiPlanService(PlanRepository repo) {
        this.repo = repo;
    }

    public PlanAdvisorResponseDTO recommendPlan(PlanAdvisorRequestDTO request) {

        // 1. Load real plans (same as your controller)
        var planRows = repo.findPlansByServiceTypeName(request.getServiceType());

        if (planRows.isEmpty()) {
            throw new RuntimeException("No plans found");
        }

        // 2. Convert to simple scoring model
        var bestPlan = planRows.stream()
                .min(Comparator.comparingDouble(p ->
                        scorePlan(p.monthlyPrice(), request)
                ))
                .orElse(planRows.get(0));

        var backupPlan = planRows.stream()
                .filter(p -> p.planId() != bestPlan.planId())
                .findFirst()
                .orElse(bestPlan);

        // 3. Build response
        PlanAdvisorResponseDTO response = new PlanAdvisorResponseDTO();

        response.setRecommendedPlanId(bestPlan.planId());
        response.setRecommendedPlanName(bestPlan.planName());
        response.setReason(buildReason(bestPlan.planName(), request));

        response.setBackupPlanId(backupPlan.planId());
        response.setBackupPlanName(backupPlan.planName());
        response.setBackupReason("This is a secondary option based on your preferences.");

        response.setDisclaimer("Recommendation based on available plans.");

        return response;
    }

    private double scorePlan(double price, PlanAdvisorRequestDTO request) {
        double score = 0;

        if (request.getMonthlyBudget() != null) {
            score += Math.abs(price - request.getMonthlyBudget());
        }

        if ("lowest_price".equalsIgnoreCase(request.getPriority())) {
            score += price * 0.5;
        }

        if ("best_value".equalsIgnoreCase(request.getPriority())) {
            score += price * 0.2;
        }

        return score;
    }

    private String buildReason(String planName, PlanAdvisorRequestDTO request) {
        return "Based on your budget of $" + request.getMonthlyBudget() +
                " and preference for " + request.getPriority() +
                ", the " + planName + " is the best fit.";
    }
}