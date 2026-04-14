package org.example.repository;

import org.example.model.ChatRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRequestRepository extends JpaRepository<ChatRequest, Integer> {

    List<ChatRequest> findByStatusOrderByRequestedAtAsc(String status);

    List<ChatRequest> findByCustomerUserIdOrderByRequestedAtDesc(Integer customerUserId);

    List<ChatRequest> findByAssignedEmployeeUserIdOrderByRequestedAtDesc(Integer assignedEmployeeUserId);

    Optional<ChatRequest> findByConversationId(Integer conversationId);

}