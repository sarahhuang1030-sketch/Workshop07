package org.example.controller;

import org.example.dto.ManagerPlanFeatureDTO;
import org.example.dto.SavePlanFeatureRequestDTO;
import org.example.service.ManagerPlanFeatureService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/plans/{planId}/features")
public class ManagerPlanFeatureController {

    private final ManagerPlanFeatureService service;

    public ManagerPlanFeatureController(ManagerPlanFeatureService service) {
        this.service = service;
    }

    @GetMapping
    public List<ManagerPlanFeatureDTO> getByPlanId(@PathVariable int planId) {
        return service.getByPlanId(planId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ManagerPlanFeatureDTO create(@PathVariable int planId,
                                       @RequestBody SavePlanFeatureRequestDTO request) {
        return service.create(new SavePlanFeatureRequestDTO(
                planId,
                request.featureName(),
                request.featureValue(),
                request.unit(),
                request.sortOrder()
        ));
    }

    @PutMapping("/{featureId}")
    public ManagerPlanFeatureDTO update(@PathVariable int planId,
                                       @PathVariable int featureId,
                                       @RequestBody SavePlanFeatureRequestDTO request) {
        return service.update(featureId, new SavePlanFeatureRequestDTO(
                planId,
                request.featureName(),
                request.featureValue(),
                request.unit(),
                request.sortOrder()
        ));
    }

    @DeleteMapping("/{featureId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int planId, @PathVariable int featureId) {
        service.delete(featureId);
    }

}