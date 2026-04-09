package org.example.service;

import org.example.dto.ChatRequestDTO;
import org.example.model.ChatRequest;
import org.example.model.Conversation;
import org.example.repository.ChatRequestRepository;
import org.example.repository.ConversationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ChatRequestService {

    private final ChatRequestRepository chatRequestRepository;
    private final ConversationRepository conversationRepository;
    private final ChatNotificationService chatNotificationService;

    private static final DateTimeFormatter CHAT_TIME_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    public ChatRequestService(ChatRequestRepository chatRequestRepository,
                              ConversationRepository conversationRepository,
                              ChatNotificationService chatNotificationService) {
        this.chatRequestRepository = chatRequestRepository;
        this.conversationRepository = conversationRepository;
        this.chatNotificationService = chatNotificationService;
    }

    public List<ChatRequestDTO> getPendingRequests() {
        List<ChatRequest> requests =
                chatRequestRepository.findByStatusOrderByRequestedAtAsc("PENDING");

        List<ChatRequestDTO> result = new ArrayList<>();

        for (ChatRequest request : requests) {
            result.add(toDto(request));
        }

        return result;
    }

    public ChatRequestDTO createRequest(Integer customerUserId, String reason, String comment) {
        ChatRequest request = new ChatRequest();
        request.setCustomerUserId(customerUserId);
        request.setReason(reason);
        request.setComment(comment);
        request.setStatus("PENDING");
        request.setRequestedAt(LocalDateTime.now());

        ChatRequest saved = chatRequestRepository.save(request);
        ChatRequestDTO dto = toDto(saved);
        chatNotificationService.notifyNewChatRequest(dto);
        return dto;
    }

    public ChatRequestDTO acceptRequest(Integer requestId, Integer employeeUserId) {
        ChatRequest request = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Chat request not found"));

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new RuntimeException("Only pending requests can be accepted");
        }

        Integer customerUserId = request.getCustomerUserId();
        Integer userLowId = Math.min(customerUserId, employeeUserId);
        Integer userHighId = Math.max(customerUserId, employeeUserId);

        Conversation conversation = new Conversation();
        conversation.setUserLowId(userLowId);
        conversation.setUserHighId(userHighId);
        conversation.setCreatedAt(LocalDateTime.now());
        conversation.setLastMessageAt(LocalDateTime.now());
        conversation.setStatus("ACTIVE");

        Conversation savedConversation = conversationRepository.save(conversation);

        request.setAssignedEmployeeUserId(employeeUserId);
        request.setConversationId(savedConversation.getConversationId());
        request.setStatus("ACTIVE");
        request.setAcceptedAt(LocalDateTime.now());

        ChatRequest savedRequest = chatRequestRepository.save(request);
        ChatRequestDTO dto = toDto(savedRequest);
        chatNotificationService.notifyChatRequestAccepted(dto);
        return dto;
    }

    public ChatRequestDTO closeRequest(Integer requestId) {
        ChatRequest request = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Chat request not found"));

        if (!"CLOSED".equalsIgnoreCase(request.getStatus())) {
            request.setStatus("CLOSED");
            request.setClosedAt(LocalDateTime.now());
        }

        ChatRequest saved = chatRequestRepository.save(request);
        ChatRequestDTO dto = toDto(saved);
        chatNotificationService.notifyChatRequestClosed(dto);
        return dto;
    }

    private ChatRequestDTO toDto(ChatRequest request) {
        ChatRequestDTO dto = new ChatRequestDTO();
        dto.setRequestId(request.getRequestId());
        dto.setCustomerUserId(request.getCustomerUserId());
        dto.setAssignedEmployeeUserId(request.getAssignedEmployeeUserId());
        dto.setConversationId(request.getConversationId());
        dto.setReason(request.getReason());
        dto.setComment(request.getComment());
        dto.setStatus(request.getStatus());
        dto.setRequestedAt(format(request.getRequestedAt()));
        dto.setAcceptedAt(format(request.getAcceptedAt()));
        dto.setClosedAt(format(request.getClosedAt()));
        return dto;
    }

    private String format(LocalDateTime value) {
        return value == null ? null : value.format(CHAT_TIME_FMT);
    }
}