package org.example.repository;

import org.example.model.PlanFeature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanFeatureRepository extends JpaRepository<PlanFeature, Integer> {
    List<PlanFeature> findByPlanIdOrderBySortOrderAscFeatureIdAsc(Integer planId);

}