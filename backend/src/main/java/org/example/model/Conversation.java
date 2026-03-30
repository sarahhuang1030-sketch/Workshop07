package org.example.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer conversationId;

    private Integer userHighId;
    private Integer userLowId;

    private LocalDateTime createdAt;
    private LocalDateTime lastMessageAt;

    public Integer getConversationId() { return conversationId; }
    public Integer getUserHighId() { return userHighId; }
    public Integer getUserLowId() { return userLowId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getLastMessageAt() { return lastMessageAt; }
}
