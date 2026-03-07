package org.example.service;

import org.example.dto.ManagerPlanDTO;
import org.example.dto.SaveManagerPlanRequestDTO;
import org.example.repository.ManagerPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ManagerPlanService {

    private final ManagerPlanRepository managerPlanRepository;

    public ManagerPlanService(ManagerPlanRepository managerPlanRepository) {
        this.managerPlanRepository = managerPlanRepository;
    }

    public List<ManagerPlanDTO> getAllPlans() {
        return managerPlanRepository.findAll();
    }

    public ManagerPlanDTO getPlanById(int id) {
        ManagerPlanDTO dto = managerPlanRepository.findById(id);
        if (dto == null) {
            throw new RuntimeException("Plan not found: " + id);
        }
        return dto;
    }

    public ManagerPlanDTO createPlan(SaveManagerPlanRequestDTO request) {
        int newId = managerPlanRepository.create(request);
        return getPlanById(newId);
    }

    public ManagerPlanDTO updatePlan(int id, SaveManagerPlanRequestDTO request) {
        int updated = managerPlanRepository.update(id, request);
        if (updated == 0) {
            throw new RuntimeException("Plan not found: " + id);
        }
        return getPlanById(id);
    }

    @Transactional
    public void deletePlan(int id) {
        int deleted = managerPlanRepository.delete(id);
        if (deleted == 0) {
            throw new RuntimeException("Plan not found: " + id);
        }
    }
}