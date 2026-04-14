package org.example.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ConversationId")
    private Integer conversationId;

    @Column(name = "UserHighId", nullable = false)
    private Integer userHighId;

    @Column(name = "UserLowId", nullable = false)
    private Integer userLowId;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "LastMessageAt", nullable = false)
    private LocalDateTime lastMessageAt;

    @Column(name = "Status", nullable = false)
    private String status = "ACTIVE";

    @Column(name = "Reason")
    private String reason;

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

    public String getReason() {
        return reason;
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

    public void setReason(String reason) {
        this.reason = reason;
    }
}