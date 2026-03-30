package org.example.controller;

import org.example.dto.SendMessageRequestDTO;
import org.example.model.ChatMessage;
import org.example.model.Conversation;
import org.example.repository.ChatMessageRepository;
import org.example.repository.ConversationRepository;
import org.springframework.web.bind.annotation.*;
import java.time.format.DateTimeFormatter;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ConversationRepository conversationRepo;
    private final ChatMessageRepository messageRepo;


    public ChatController(ConversationRepository conversationRepo,
                          ChatMessageRepository messageRepo) {
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
    }

    private static final DateTimeFormatter CHAT_TIME_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    // =========================
    // GET CONVERSATIONS
    // =========================
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

            result.add(map);
        }

        return result;
    }

    // =========================
    // GET MESSAGES
    // =========================
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

    @PostMapping("/{conversationId}/send")
    public ChatMessage sendMessage(
            @PathVariable int conversationId,
            @RequestBody SendMessageRequestDTO req
    ) {
        ChatMessage msg = new ChatMessage();
        msg.setConversationId(conversationId);
        msg.setFromUserId(req.getFromUserId());
        msg.setToUserId(req.getToUserId());
        msg.setMessageText(req.getMessageText());
        msg.setSentAt(LocalDateTime.now());
        msg.setIsRead(false);

        return messageRepo.save(msg);
    }
}