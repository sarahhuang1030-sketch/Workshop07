package org.example.controller.ai;

import org.example.dto.ai.PlanAdvisorRequestDTO;
import org.example.dto.ai.PlanAdvisorResponseDTO;
import org.example.service.ai.AiPlanService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin
public class AiPlanController {

    private final AiPlanService service;

    public AiPlanController(AiPlanService service) {
        this.service = service;
    }

    @PostMapping("/plan-advice")
    public PlanAdvisorResponseDTO getPlanAdvice(@RequestBody PlanAdvisorRequestDTO request) {
        return service.recommendPlan(request);
    }
}