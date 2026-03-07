package org.example.controller;

import org.example.dto.FeatureTemplateDTO;
import org.example.service.ManagerPlanFeatureService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/manager/plans/features/templates")
public class ManagerPlanFeatureTemplateController {

    private final ManagerPlanFeatureService service;

    public ManagerPlanFeatureTemplateController(ManagerPlanFeatureService service) {
        this.service = service;
    }

    @GetMapping
    public List<FeatureTemplateDTO> getTemplates() {
        return service.getFeatureTemplates();
    }
}