package org.example.repository;

import org.example.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {

    List<ChatMessage> findByConversationIdOrderBySentAtAsc(Integer conversationId);
}