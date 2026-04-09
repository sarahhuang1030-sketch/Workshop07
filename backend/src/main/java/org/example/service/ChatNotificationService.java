package org.example.service;

import org.example.dto.ChatRequestDTO;
import org.example.model.ChatMessage;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class ChatNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    private static final DateTimeFormatter CHAT_TIME_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    public ChatNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyNewMessage(ChatMessage message) {
        System.out.println("[WS-SERVER] notifyNewMessage start: conversationId=" + message.getConversationId()
                + ", fromUserId=" + message.getFromUserId()
                + ", toUserId=" + message.getToUserId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("eventType", "NEW_MESSAGE");
        payload.put("messageId", message.getMessageId());
        payload.put("conversationId", message.getConversationId());
        payload.put("fromUserId", message.getFromUserId());
        payload.put("toUserId", message.getToUserId());
        payload.put("messageText", message.getMessageText());
        payload.put("sentAt",
                message.getSentAt() != null ? message.getSentAt().format(CHAT_TIME_FMT) : "");
        payload.put("isRead", message.getIsRead());

        System.out.println("[WS-SERVER] Sending to /topic/conversation/" + message.getConversationId());
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + message.getConversationId(),
                payload
        );

        System.out.println("[WS-SERVER] Sending to /topic/user/" + message.getToUserId());
        messagingTemplate.convertAndSend(
                "/topic/user/" + message.getToUserId(),
                payload
        );

        System.out.println("[WS-SERVER] notifyNewMessage done");
    }

    public void notifyNewChatRequest(ChatRequestDTO request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventType", "NEW_CHAT_REQUEST");
        payload.put("requestId", request.getRequestId());
        payload.put("customerUserId", request.getCustomerUserId());
        payload.put("assignedEmployeeUserId", request.getAssignedEmployeeUserId());
        payload.put("conversationId", request.getConversationId());
        payload.put("reason", request.getReason());
        payload.put("comment", request.getComment());
        payload.put("status", request.getStatus());
        payload.put("requestedAt", request.getRequestedAt());
        payload.put("acceptedAt", request.getAcceptedAt());
        payload.put("closedAt", request.getClosedAt());

        messagingTemplate.convertAndSend("/topic/chat-requests", payload);
    }

    public void notifyChatRequestAccepted(ChatRequestDTO request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventType", "CHAT_REQUEST_ACCEPTED");
        payload.put("requestId", request.getRequestId());
        payload.put("customerUserId", request.getCustomerUserId());
        payload.put("assignedEmployeeUserId", request.getAssignedEmployeeUserId());
        payload.put("conversationId", request.getConversationId());
        payload.put("reason", request.getReason());
        payload.put("comment", request.getComment());
        payload.put("status", request.getStatus());
        payload.put("requestedAt", request.getRequestedAt());
        payload.put("acceptedAt", request.getAcceptedAt());
        payload.put("closedAt", request.getClosedAt());

        messagingTemplate.convertAndSend("/topic/chat-requests", payload);

        if (request.getAssignedEmployeeUserId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/user/" + request.getAssignedEmployeeUserId(),
                    payload
            );
        }

        messagingTemplate.convertAndSend(
                "/topic/user/" + request.getCustomerUserId(),
                payload
        );
    }

    public void notifyChatRequestClosed(ChatRequestDTO request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventType", "CHAT_REQUEST_CLOSED");
        payload.put("requestId", request.getRequestId());
        payload.put("customerUserId", request.getCustomerUserId());
        payload.put("assignedEmployeeUserId", request.getAssignedEmployeeUserId());
        payload.put("conversationId", request.getConversationId());
        payload.put("reason", request.getReason());
        payload.put("comment", request.getComment());
        payload.put("status", request.getStatus());
        payload.put("requestedAt", request.getRequestedAt());
        payload.put("acceptedAt", request.getAcceptedAt());
        payload.put("closedAt", request.getClosedAt());

        messagingTemplate.convertAndSend("/topic/chat-requests", payload);

        if (request.getAssignedEmployeeUserId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/user/" + request.getAssignedEmployeeUserId(),
                    payload
            );
        }

        messagingTemplate.convertAndSend(
                "/topic/user/" + request.getCustomerUserId(),
                payload
        );
    }
}