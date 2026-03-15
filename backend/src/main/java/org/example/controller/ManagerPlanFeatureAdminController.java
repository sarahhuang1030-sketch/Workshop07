package org.example.controller;

import org.example.dto.ManagerPlanFeatureDTO;
import org.example.dto.SavePlanFeatureRequestDTO;
import org.example.service.ManagerPlanFeatureService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/planfeatures")
public class ManagerPlanFeatureAdminController {

    private final ManagerPlanFeatureService service;

    public ManagerPlanFeatureAdminController(ManagerPlanFeatureService service) {
        this.service = service;
    }

    @GetMapping
    public List<ManagerPlanFeatureDTO> getAll() {
        return service.getAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ManagerPlanFeatureDTO create(@RequestBody SavePlanFeatureRequestDTO request) {
        return service.create(request);
    }

    @PutMapping("/{featureId}")
    public ManagerPlanFeatureDTO update(
            @PathVariable int featureId,
            @RequestBody SavePlanFeatureRequestDTO request
    ) {
        return service.update(featureId, request);
    }

    @DeleteMapping("/{featureId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int featureId) {
        service.delete(featureId);
    }
}