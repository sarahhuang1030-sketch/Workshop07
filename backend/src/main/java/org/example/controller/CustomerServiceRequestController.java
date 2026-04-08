package org.example.controller;

import org.example.dto.ManagerServiceRequestDTO;
import org.example.model.ServiceRequest;
import org.example.model.UserAccount;
import org.example.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/customer/service-requests")
public class CustomerServiceRequestController {

    private final ManagerServiceRequestRepository serviceRequestRepository;
    private final UserAccountRepository userAccountRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomerAddressRepository customerAddressRepository;

    public CustomerServiceRequestController(
            ManagerServiceRequestRepository serviceRequestRepository,
            UserAccountRepository userAccountRepository,
            CustomerRepository customerRepository,
            EmployeeRepository employeeRepository,
            CustomerAddressRepository customerAddressRepository
    ) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.userAccountRepository = userAccountRepository;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.customerAddressRepository = customerAddressRepository;
    }

    @GetMapping
    public List<ManagerServiceRequestDTO> getMyServiceRequests(Authentication authentication) {
        UserAccount user = userAccountRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCustomerId() == null) {
            return List.of();
        }

        return serviceRequestRepository.findByCustomerId(user.getCustomerId())
                .stream()
                .map(this::toRequestDTO)
                .toList();
    }

    @PostMapping
    public ResponseEntity<ServiceRequest> createServiceRequest(
            Authentication authentication,
            @RequestBody ServiceRequest request
    ) {
        UserAccount user = userAccountRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCustomerId() == null) {
            return ResponseEntity.badRequest().build();
        }

        request.setCustomerId(user.getCustomerId());
        request.setCreatedByUserId(user.getUserId());
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        request.setStatus("Open");

        ServiceRequest saved = serviceRequestRepository.save(request);
        return ResponseEntity.ok(saved);
    }

    private ManagerServiceRequestDTO toRequestDTO(ServiceRequest request) {
        ManagerServiceRequestDTO dto = new ManagerServiceRequestDTO();
        dto.setRequestId(request.getRequestId());
        dto.setCustomerId(request.getCustomerId());
        dto.setCreatedByUserId(request.getCreatedByUserId());
        dto.setAssignedTechnicianUserId(request.getAssignedTechnicianUserId());
        dto.setRequestType(request.getRequestType());
        dto.setStatus(request.getStatus());
        dto.setDescription(request.getDescription());
        dto.setPriority(request.getPriority() != null ? request.getPriority().name() : null);
        dto.setCreatedAt(request.getCreatedAt());
        dto.setCustomerName(
                request.getCustomerId() != null
                        ? customerRepository.findById(request.getCustomerId())
                        .map(c -> c.getFirstName() + " " + c.getLastName())
                        .orElse("—")
                        : "—"
        );

        dto.setCreatedByName(
                request.getCreatedByUserId() != null
                        ? employeeRepository.findById(request.getCreatedByUserId())
                        .map(e -> e.getFirstName() + " " + e.getLastName())
                        .orElse("—")
                        : "—"
        );

        dto.setTechnicianName(
                request.getAssignedTechnicianUserId() != null
                        ? employeeRepository.findById(request.getAssignedTechnicianUserId())
                        .map(e -> e.getFirstName() + " " + e.getLastName())
                        .orElse("—")
                        : "—"
        );

        customerAddressRepository.findFirstByCustomerIdOrderByIsPrimaryDesc(request.getCustomerId())
                .ifPresent(address -> {
                    dto.setAddressId(address.getAddressId().intValue());
                    dto.setAddressText(
                            ((address.getStreet1() != null ? address.getStreet1() : "") + " " +
                                    (address.getStreet2() != null ? address.getStreet2() : "") + ", " +
                                    (address.getCity() != null ? address.getCity() : "") + ", " +
                                    (address.getProvince() != null ? address.getProvince() : "") + " " +
                                    (address.getPostalCode() != null ? address.getPostalCode() : ""))
                                    .trim()
                    );
                });

        return dto;
    }
}
