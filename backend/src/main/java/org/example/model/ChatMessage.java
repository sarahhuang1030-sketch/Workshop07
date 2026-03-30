package org.example.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chatmessages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer messageId;

    private Integer conversationId;
    private Integer fromUserId;
    private Integer toUserId;

    private String messageText;

    private LocalDateTime sentAt;

    private Boolean isRead;

    public Integer getMessageId() { return messageId; }
    public Integer getConversationId() { return conversationId; }
    public Integer getFromUserId() { return fromUserId; }
    public Integer getToUserId() { return toUserId; }
    public String getMessageText() { return messageText; }
    public LocalDateTime getSentAt() { return sentAt; }
    public Boolean getIsRead() { return isRead; }
}