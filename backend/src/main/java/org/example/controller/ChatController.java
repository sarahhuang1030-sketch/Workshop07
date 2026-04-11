package org.example.controller;

import org.example.dto.ChatRequestDTO;
import org.example.dto.SendMessageRequestDTO;
import org.example.model.ChatMessage;
import org.example.model.Conversation;
import org.example.repository.ChatMessageRepository;
import org.example.repository.ConversationRepository;
import org.example.service.ChatNotificationService;
import org.example.service.ChatRequestService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ConversationRepository conversationRepo;
    private final ChatMessageRepository messageRepo;
    private final ChatRequestService chatRequestService;
    private final ChatNotificationService chatNotificationService;

    public ChatController(ConversationRepository conversationRepo,
                          ChatMessageRepository messageRepo,
                          ChatRequestService chatRequestService,
                          ChatNotificationService chatNotificationService) {
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
        this.chatRequestService = chatRequestService;
        this.chatNotificationService = chatNotificationService;
    }

    private static final DateTimeFormatter CHAT_TIME_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    // GET CONVERSATIONS
    @GetMapping("/conversations")
    public List<Map<String, Object>> getConversations(@RequestParam int userId) {

        List<Conversation> list =
                conversationRepo.findByUserHighIdOrUserLowIdOrderByLastMessageAtDesc(userId, userId);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Conversation c : list) {

            int otherUserId =
                    (c.getUserHighId().equals(userId))
                            ? c.getUserLowId()
                            : c.getUserHighId();

            Map<String, Object> map = new HashMap<>();
            map.put("conversationId", c.getConversationId());
            map.put("otherUserId", otherUserId);
            map.put("createdAt",
                    c.getCreatedAt() != null ? c.getCreatedAt().format(CHAT_TIME_FMT) : "");
            map.put("status", c.getStatus());

            result.add(map);
        }

        return result;
    }

    // OLD REQUESTS (KEEP TEMP)
    @GetMapping("/requests")
    public List<Map<String, Object>> getConversationRequests() {

        List<Conversation> list =
                conversationRepo.findByStatusOrderByCreatedAtDesc("REQUEST");

        List<Map<String, Object>> result = new ArrayList<>();

        for (Conversation c : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("conversationId", c.getConversationId());
            map.put("userLowId", c.getUserLowId());
            map.put("userHighId", c.getUserHighId());
            map.put("createdAt",
                    c.getCreatedAt() != null ? c.getCreatedAt().format(CHAT_TIME_FMT) : "");
            map.put("status", c.getStatus());

            result.add(map);
        }

        return result;
    }

    // NEW: CHAT REQUESTS
    @GetMapping("/chat-requests")
    public List<ChatRequestDTO> getPendingChatRequests() {
        return chatRequestService.getPendingRequests();
    }

    @PostMapping("/chat-requests")
    public ChatRequestDTO createChatRequest(
            @RequestParam Integer customerUserId,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String comment
    ) {
        return chatRequestService.createRequest(customerUserId, reason, comment);
    }

    @PostMapping("/chat-requests/{requestId}/accept")
    public ChatRequestDTO acceptChatRequest(
            @PathVariable Integer requestId,
            @RequestParam Integer employeeUserId
    ) {
        return chatRequestService.acceptRequest(requestId, employeeUserId);
    }

    @PostMapping("/chat-requests/{requestId}/close")
    public ChatRequestDTO closeChatRequest(@PathVariable Integer requestId) {
        return chatRequestService.closeRequest(requestId);
    }

    // GET MESSAGES
    @GetMapping("/{conversationId}/messages")
    public List<Map<String, Object>> getMessages(@PathVariable int conversationId) {

        List<ChatMessage> msgs =
                messageRepo.findByConversationIdOrderBySentAtAsc(conversationId);

        List<Map<String, Object>> result = new ArrayList<>();

        for (ChatMessage m : msgs) {
            Map<String, Object> map = new HashMap<>();
            map.put("messageId", m.getMessageId());
            map.put("conversationId", m.getConversationId());
            map.put("fromUserId", m.getFromUserId());
            map.put("toUserId", m.getToUserId());
            map.put("messageText", m.getMessageText());
            map.put("sentAt", m.getSentAt() != null ? m.getSentAt().format(CHAT_TIME_FMT) : "");
            map.put("isRead", m.getIsRead());

            result.add(map);
        }

        return result;
    }

    // SEND MESSAGE
    @PostMapping("/{conversationId}/send")
    public ChatMessage sendMessage(
            @PathVariable int conversationId,
            @RequestBody SendMessageRequestDTO req
    ) {
        Conversation conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if ("CLOSED".equalsIgnoreCase(conversation.getStatus())) {
            throw new RuntimeException("Conversation is closed");
        }

        ChatMessage msg = new ChatMessage();
        msg.setConversationId(conversationId);
        msg.setFromUserId(req.getFromUserId());
        msg.setToUserId(req.getToUserId());
        msg.setMessageText(req.getMessageText());
        msg.setSentAt(LocalDateTime.now());
        msg.setIsRead(false);

        ChatMessage saved = messageRepo.save(msg);

        conversation.setLastMessageAt(saved.getSentAt());
        conversationRepo.save(conversation);

        System.out.println("[CHAT API] Message saved for conversation " + conversationId);
        System.out.println("[CHAT API] About to notify websocket listeners");
        chatNotificationService.notifyNewMessage(saved);
        System.out.println("[CHAT API] Websocket notify finished");

        return saved;
    }

    // CLOSE CONVERSATION
    @PostMapping("/{conversationId}/close")
    public Map<String, Object> closeConversation(@PathVariable int conversationId) {
        Conversation conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!"CLOSED".equalsIgnoreCase(conversation.getStatus())) {
            conversation.setStatus("CLOSED");
            conversationRepo.save(conversation);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("conversationId", conversation.getConversationId());
        result.put("status", conversation.getStatus());
        return result;
    }

    // MARK AS READ
    @PostMapping("/{conversationId}/mark-read")
    public void markConversationRead(
            @PathVariable int conversationId,
            @RequestParam int viewerUserId
    ) {
        messageRepo.markMessagesAsRead(conversationId, viewerUserId);

        System.out.println("[CHAT API] Marked messages as read for convo="
                + conversationId + ", viewer=" + viewerUserId);
    }
}