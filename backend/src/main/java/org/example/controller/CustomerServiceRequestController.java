package org.example.controller;

import org.example.dto.ServiceRequestDTO;
import org.example.model.ServiceRequest;
import org.example.model.UserAccount;
import org.example.repository.ServiceRequestRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customer/service-requests")
public class CustomerServiceRequestController {

    private final ServiceRequestRepository serviceRequestRepository;
    private final UserAccountRepository userAccountRepository;

    public CustomerServiceRequestController(ServiceRequestRepository serviceRequestRepository,
                                            UserAccountRepository userAccountRepository) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping
    public ResponseEntity<List<ServiceRequestDTO>> getMyServiceRequests(Authentication authentication) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCustomerId() == null) {
            return ResponseEntity.status(403).build();
        }

        List<ServiceRequestDTO> requests = serviceRequestRepository.findByCustomerId(user.getCustomerId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(requests);
    }

    @PostMapping
    public ResponseEntity<ServiceRequestDTO> createServiceRequest(@RequestBody ServiceRequestDTO dto, Authentication authentication) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCustomerId() == null) {
            return ResponseEntity.status(403).build();
        }

        ServiceRequest request = new ServiceRequest();
        request.setCustomerId(user.getCustomerId());
        request.setCreatedByUserId(user.getUserId());
        request.setRequestType(dto.getRequestType());
        request.setPriority(dto.getPriority() != null ? ServiceRequest.Priority.valueOf(dto.getPriority()) : ServiceRequest.Priority.Medium);
        request.setStatus("OPEN");
        request.setDescription(dto.getDescription());
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        ServiceRequest saved = serviceRequestRepository.save(request);
        return ResponseEntity.ok(convertToDTO(saved));
    }

    private ServiceRequestDTO convertToDTO(ServiceRequest request) {
        ServiceRequestDTO dto = new ServiceRequestDTO();
        dto.setRequestId(request.getRequestId());
        dto.setCustomerId(request.getCustomerId());
        dto.setRequestType(request.getRequestType());
        dto.setPriority(request.getPriority() != null ? request.getPriority().name() : null);
        dto.setStatus(request.getStatus());
        dto.setDescription(request.getDescription());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());
        return dto;
    }
}
