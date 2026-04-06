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

    @Column(name = "Status", nullable = false)
    private String status = "ACTIVE";

    public Integer getConversationId() {
        return conversationId;
    }

    public Integer getUserHighId() {
        return userHighId;
    }

    public Integer getUserLowId() {
        return userLowId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getLastMessageAt() {
        return lastMessageAt;
    }

    public String getStatus() {
        return status;
    }

    public void setConversationId(Integer conversationId) {
        this.conversationId = conversationId;
    }

    public void setUserHighId(Integer userHighId) {
        this.userHighId = userHighId;
    }

    public void setUserLowId(Integer userLowId) {
        this.userLowId = userLowId;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setLastMessageAt(LocalDateTime lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}