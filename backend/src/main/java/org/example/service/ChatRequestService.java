package org.example.service;

import org.example.dto.ChatRequestDTO;
import org.example.model.ChatRequest;
import org.example.model.Conversation;
import org.example.model.Customer;
import org.example.model.UserAccount;
import org.example.repository.ChatRequestRepository;
import org.example.repository.ConversationRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.UserAccountRepository;
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
    private final UserAccountRepository userAccountRepository;
    private final CustomerRepository customerRepository;

    private static final DateTimeFormatter CHAT_TIME_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    public ChatRequestService(ChatRequestRepository chatRequestRepository,
                              ConversationRepository conversationRepository,
                              ChatNotificationService chatNotificationService,
                              UserAccountRepository userAccountRepository,
                              CustomerRepository customerRepository) {
        this.chatRequestRepository = chatRequestRepository;
        this.conversationRepository = conversationRepository;
        this.chatNotificationService = chatNotificationService;
        this.userAccountRepository = userAccountRepository;
        this.customerRepository = customerRepository;
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

    public List<ChatRequestDTO> getRequestsForWorkspace(boolean manager, Integer employeeUserId) {
        List<ChatRequest> allRequests = chatRequestRepository.findAll();

        List<ChatRequestDTO> result = new ArrayList<>();

        for (ChatRequest request : allRequests) {
            String status = request.getStatus() != null
                    ? request.getStatus().toUpperCase()
                    : "";

            if (manager) {
                result.add(toDto(request));
                continue;
            }

            boolean isPending = "PENDING".equals(status);
            boolean isMyActive =
                    "ACTIVE".equals(status) &&
                            request.getAssignedEmployeeUserId() != null &&
                            request.getAssignedEmployeeUserId().equals(employeeUserId);

            if (isPending || isMyActive) {
                result.add(toDto(request));
            }
        }

        result.sort((a, b) -> {
            String aTime = a.getRequestedAt() != null ? a.getRequestedAt() : "";
            String bTime = b.getRequestedAt() != null ? b.getRequestedAt() : "";
            return bTime.compareTo(aTime);
        });

        return result;
    }

    public ChatRequestDTO getCurrentRequestForCustomer(Integer customerUserId) {
        List<ChatRequest> requests =
                chatRequestRepository.findByCustomerUserIdOrderByRequestedAtDesc(customerUserId);

        for (ChatRequest r : requests) {
            if ("ACTIVE".equalsIgnoreCase(r.getStatus())) {
                return toDto(r);
            }
        }

        for (ChatRequest r : requests) {
            if ("PENDING".equalsIgnoreCase(r.getStatus())) {
                return toDto(r);
            }
        }

        return null;
    }

    public ChatRequestDTO createRequest(Integer customerUserId, String reason, String comment) {
        List<ChatRequest> existing =
                chatRequestRepository.findByCustomerUserIdOrderByRequestedAtDesc(customerUserId);

        for (ChatRequest r : existing) {
            if ("PENDING".equalsIgnoreCase(r.getStatus()) ||
                    "ACTIVE".equalsIgnoreCase(r.getStatus())) {
                throw new RuntimeException("Customer already has an open chat request");
            }
        }

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
        conversation.setReason(request.getReason());

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

        if (!"ACTIVE".equalsIgnoreCase(request.getStatus())) {
            throw new RuntimeException("Only active requests can be closed");
        }

        request.setStatus("CLOSED");
        request.setClosedAt(LocalDateTime.now());

        ChatRequest saved = chatRequestRepository.save(request);
        ChatRequestDTO dto = toDto(saved);
        chatNotificationService.notifyChatRequestClosed(dto);
        return dto;
    }

    public ChatRequestDTO closeRequestByConversationId(Integer conversationId) {
        ChatRequest request = chatRequestRepository.findByConversationId(conversationId)
                .orElse(null);

        if (request == null) {
            return null;
        }

        if (!"CLOSED".equalsIgnoreCase(request.getStatus())) {
            request.setStatus("CLOSED");
            request.setClosedAt(LocalDateTime.now());
        }

        ChatRequest saved = chatRequestRepository.save(request);
        ChatRequestDTO dto = toDto(saved);

        chatNotificationService.notifyChatRequestClosed(dto);

        return dto;
    }

    public ChatRequestDTO cancelRequest(Integer requestId, Integer customerUserId) {
        ChatRequest request = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Chat request not found"));

        if (!request.getCustomerUserId().equals(customerUserId)) {
            throw new RuntimeException("Unauthorized cancel attempt");
        }

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new RuntimeException("Only pending requests can be cancelled");
        }

        request.setStatus("CANCELLED");

        ChatRequest saved = chatRequestRepository.save(request);
        return toDto(saved);
    }

    public ChatRequestDTO cancelRequestByEmployee(Integer requestId, Integer employeeUserId) {
        ChatRequest request = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Chat request not found"));

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new RuntimeException("Only pending requests can be cancelled");
        }

        request.setStatus("CANCELLED");
        request.setClosedAt(LocalDateTime.now());

        ChatRequest saved = chatRequestRepository.save(request);
        ChatRequestDTO dto = toDto(saved);

        chatNotificationService.notifyChatRequestClosed(dto);

        return dto;
    }

    private ChatRequestDTO toDto(ChatRequest request) {
        ChatRequestDTO dto = new ChatRequestDTO();

        Customer customer = resolveCustomer(request.getCustomerUserId());

        dto.setRequestId(request.getRequestId());
        dto.setCustomerUserId(request.getCustomerUserId());
        dto.setCustomerId(customer != null ? customer.getCustomerId() : null);
        dto.setAssignedEmployeeUserId(request.getAssignedEmployeeUserId());
        dto.setConversationId(request.getConversationId());
        dto.setReason(request.getReason());
        dto.setComment(request.getComment());
        dto.setStatus(request.getStatus());
        dto.setRequestedAt(format(request.getRequestedAt()));
        dto.setAcceptedAt(format(request.getAcceptedAt()));
        dto.setClosedAt(format(request.getClosedAt()));
        dto.setCustomerName(buildCustomerName(request.getCustomerUserId(), customer));

        return dto;
    }

    private Customer resolveCustomer(Integer customerUserId) {
        if (customerUserId == null) {
            return null;
        }

        UserAccount ua = userAccountRepository.findById(customerUserId).orElse(null);
        if (ua == null || ua.getCustomerId() == null) {
            return null;
        }

        return customerRepository.findById(ua.getCustomerId()).orElse(null);
    }

    private String buildCustomerName(Integer customerUserId, Customer customer) {
        if (customer == null) {
            return customerUserId == null ? "Customer" : "Customer #" + customerUserId;
        }

        String fullName = ((customer.getFirstName() != null ? customer.getFirstName() : "") + " " +
                (customer.getLastName() != null ? customer.getLastName() : "")).trim();

        if (!fullName.isBlank()) {
            return fullName;
        }

        return "Customer #" + customerUserId;
    }

    private String format(LocalDateTime value) {
        return value == null ? null : value.format(CHAT_TIME_FMT);
    }
}