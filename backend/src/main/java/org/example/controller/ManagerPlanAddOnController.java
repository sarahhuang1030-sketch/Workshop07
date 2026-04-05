package org.example.controller;

import org.example.dto.AddOnDTO;
import org.example.repository.AddOnRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/plans/{planId}/addons")
public class ManagerPlanAddOnController {

    private final AddOnRepository repo;

    public ManagerPlanAddOnController(AddOnRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<AddOnDTO> getPlanAddOns(@PathVariable int planId) {
        return repo.findActiveAddOnsByPlanId(planId);
    }

    @PostMapping("/{addOnId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void addAddOnToPlan(
            @PathVariable int planId,
            @PathVariable int addOnId
    ) {
        repo.attachToPlan(planId, addOnId);
    }

    @DeleteMapping("/{addOnId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAddOnFromPlan(
            @PathVariable int planId,
            @PathVariable int addOnId
    ) {
        repo.removeFromPlan(planId, addOnId);
    }
}