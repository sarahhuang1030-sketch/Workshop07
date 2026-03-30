package org.example.repository;

import org.example.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {

    // Get all messages for a conversation (ordered by time)
    List<ChatMessage> findByConversationIdOrderBySentAtAsc(Integer conversationId);

    // Get unread messages for a specific user in a conversation
    List<ChatMessage> findByConversationIdAndToUserIdAndIsReadFalse(
            Integer conversationId,
            Integer toUserId
    );

    // Mark messages as read (bulk update)
    @Query("""
        UPDATE ChatMessage m
        SET m.isRead = true
        WHERE m.conversationId = :conversationId
          AND m.toUserId = :viewerUserId
          AND m.isRead = false
    """)
    int markMessagesAsRead(Integer conversationId, Integer viewerUserId);
}