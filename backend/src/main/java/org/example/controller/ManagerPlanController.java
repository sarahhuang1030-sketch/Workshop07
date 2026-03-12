package org.example.controller;

import org.example.dto.ManagerPlanDTO;
import org.example.dto.SaveManagerPlanRequestDTO;
import org.example.service.ManagerPlanService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.example.service.AuditService;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/manager/plans")
public class ManagerPlanController {

    private final ManagerPlanService managerPlanService;
    private final AuditService auditService;

    public ManagerPlanController(ManagerPlanService managerPlanService,
                                 AuditService auditService) {
        this.managerPlanService = managerPlanService;
        this.auditService=auditService;
    }

    @GetMapping
    public List<ManagerPlanDTO> getAllPlans() {
        return managerPlanService.getAllPlans();
    }

    @GetMapping("/{id}")
    public ManagerPlanDTO getPlanById(@PathVariable int id) {
        return managerPlanService.getPlanById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ManagerPlanDTO createPlan(@RequestBody SaveManagerPlanRequestDTO request,
                                     Authentication authentication) {
        ManagerPlanDTO plan = managerPlanService.createPlan(request);
        String username = authentication.getName();
        auditService.log("Plan", "Create", plan.planName(), username);
        return plan;
    }

    @PutMapping("/{id}")
    public ManagerPlanDTO updatePlan(@PathVariable int id,
                                     @RequestBody SaveManagerPlanRequestDTO request,
                                     Authentication authentication) {

        ManagerPlanDTO plan = managerPlanService.updatePlan(id, request);

        String username = authentication.getName();
        auditService.log("Plan", "Update", plan.planName(), username);

        return plan;
//        return managerPlanService.updatePlan(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlan(@PathVariable int id,
                           Authentication authentication) {

        String username = authentication.getName();

        // get plan before delete so we know what was deleted
        ManagerPlanDTO plan = managerPlanService.getPlanById(id);

        managerPlanService.deletePlan(id);

        auditService.log("Plan", "Delete", plan.planName(), username);

        //managerPlanService.deletePlan(id);
    }
}