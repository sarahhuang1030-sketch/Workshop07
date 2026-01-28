package org.example.controller;

import org.example.dto.AddOnDTO;
import org.example.dto.PlanDTO;
import org.example.dto.PlanFeatureDTO;
import org.example.repository.PlanRepository;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/plans")
public class PlanController {

    private final PlanRepository repo;

    public PlanController(PlanRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<PlanDTO> getPlans(
            @RequestParam(required = false, defaultValue = "Internet") String type,
            @RequestParam(defaultValue = "false") boolean includeAddOns
    ) {
        String normalized = (type == null) ? "" : type.trim();

        // alias support
        if (normalized.equalsIgnoreCase("home")) normalized = "Internet";

        var planRows = repo.findPlansByServiceTypeName(normalized);
        if (planRows.isEmpty()) return List.of();

        List<Integer> planIds = planRows.stream().map(PlanRepository.PlanRow::planId).toList();

        var featuresByPlan = repo.findPlanFeaturesByPlanIds(planIds);
        var addOnsByPlan = includeAddOns ? repo.findAddOnsByPlanIds(planIds) : Map.<Integer, List<AddOnDTO>>of();

        List<PlanDTO> out = new ArrayList<>();

        for (var p : planRows) {
            List<String> perks = new ArrayList<>();
            List<PlanFeatureDTO> structured = new ArrayList<>();

            for (var f : featuresByPlan.getOrDefault(p.planId(), List.of())) {
                if ("Perk".equalsIgnoreCase(f.featureName())) {
                    perks.add(f.featureValue());
                } else {
                    structured.add(new PlanFeatureDTO(f.featureName(), f.featureValue(), f.unit()));
                }
            }

            out.add(new PlanDTO(
                    p.planId(),
                    p.planName(),
                    p.monthlyPrice(),
                    p.tagline(),
                    structured,
                    perks,
                    addOnsByPlan.getOrDefault(p.planId(), List.of())
            ));
        }

        return out;
    }
}
