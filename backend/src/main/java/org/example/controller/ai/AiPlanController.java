package org.example.controller.ai;

import org.example.dto.ai.PlanAdvisorRequestDTO;
import org.example.dto.ai.PlanAdvisorResponseDTO;
import org.example.service.ai.AiPlanService;
import org.example.service.ai.UnsafePromptException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin
public class AiPlanController {

    private final AiPlanService service;

    public AiPlanController(AiPlanService service) {
        this.service = service;
    }

    @PostMapping("/plan-advice")
    public ResponseEntity<?> getPlanAdvice(@RequestBody PlanAdvisorRequestDTO request) {
        try {
            PlanAdvisorResponseDTO response = service.recommendPlan(request);
            return ResponseEntity.ok(response);
        } catch (UnsafePromptException ex) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "message", ex.getMessage(),
                            "category", ex.getCategory()
                    ));
        }
    }
}