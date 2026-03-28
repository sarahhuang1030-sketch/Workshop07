package org.example.repository;

import org.example.model.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ManagerServiceRequestRepository extends JpaRepository<ServiceRequest, Integer> {
}
