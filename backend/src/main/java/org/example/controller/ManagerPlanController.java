package org.example.controller;

import org.example.dto.ManagerPlanDTO;
import org.example.dto.SaveManagerPlanRequestDTO;
import org.example.service.ManagerPlanService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/plans")
public class ManagerPlanController {

    private final ManagerPlanService managerPlanService;

    public ManagerPlanController(ManagerPlanService managerPlanService) {
        this.managerPlanService = managerPlanService;
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
    public ManagerPlanDTO createPlan(@RequestBody SaveManagerPlanRequestDTO request) {
        return managerPlanService.createPlan(request);
    }

    @PutMapping("/{id}")
    public ManagerPlanDTO updatePlan(@PathVariable int id,
                                     @RequestBody SaveManagerPlanRequestDTO request) {
        return managerPlanService.updatePlan(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlan(@PathVariable int id) {
        managerPlanService.deletePlan(id);
    }
}