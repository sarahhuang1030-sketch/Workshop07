package org.example.dto;

public class ConversationSummaryDTO {
    private Integer conversationId;
    private Integer otherUserId;
    private String createdAt;

    public Integer getConversationId() { return conversationId; }
    public void setConversationId(Integer conversationId) { this.conversationId = conversationId; }

    public Integer getOtherUserId() { return otherUserId; }
    public void setOtherUserId(Integer otherUserId) { this.otherUserId = otherUserId; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}