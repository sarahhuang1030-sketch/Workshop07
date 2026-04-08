package org.example.repository;

import org.example.model.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ManagerServiceRequestRepository extends JpaRepository<ServiceRequest, Integer> {
    List<ServiceRequest> findByAssignedTechnicianUserId(Integer userId);
    List<ServiceRequest> findByCustomerId(Integer customerId);
}
