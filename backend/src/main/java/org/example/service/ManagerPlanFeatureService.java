package org.example.service;


import org.example.dto.FeatureTemplateDTO;
import org.example.dto.ManagerPlanFeatureDTO;
import org.example.dto.PlanDTO;
import org.example.dto.SavePlanFeatureRequestDTO;
import org.example.repository.ManagerPlanFeatureRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ManagerPlanFeatureService {

    private final ManagerPlanFeatureRepository repository;

    public ManagerPlanFeatureService(ManagerPlanFeatureRepository repository) {
        this.repository = repository;
    }

    public List<ManagerPlanFeatureDTO> getByPlanId(int planId) {
        return repository.findByPlanId(planId);
    }

    public ManagerPlanFeatureDTO create(SavePlanFeatureRequestDTO request) {
        int newId = repository.create(request);
        return repository.findById(newId);
    }

    public ManagerPlanFeatureDTO update(int featureId, SavePlanFeatureRequestDTO request) {
        int updated = repository.update(featureId, request);
        if (updated == 0) {
            throw new RuntimeException("Feature not found: " + featureId);
        }
        return repository.findById(featureId);
    }

    public void delete(int featureId) {
        int deleted = repository.delete(featureId);
        if (deleted == 0) {
            throw new RuntimeException("Feature not found: " + featureId);
        }
    }

    public List<FeatureTemplateDTO> getFeatureTemplates() {
        return repository.findFeatureTemplates();
    }

}