package org.example.repository;

import org.example.model.ChatRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatRequestRepository extends JpaRepository<ChatRequest, Integer> {

    List<ChatRequest> findByStatusOrderByRequestedAtAsc(String status);

    List<ChatRequest> findByCustomerUserIdOrderByRequestedAtDesc(Integer customerUserId);

    List<ChatRequest> findByAssignedEmployeeUserIdOrderByRequestedAtDesc(Integer assignedEmployeeUserId);
}