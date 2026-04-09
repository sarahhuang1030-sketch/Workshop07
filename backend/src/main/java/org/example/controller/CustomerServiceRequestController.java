package org.example.controller;

import org.example.dto.CustomerServiceAppointmentDTO;
import org.example.dto.CustomerServiceRequestDTO;
import org.example.model.Employee;
import org.example.model.ServiceAppointment;
import org.example.model.ServiceRequest;
import org.example.model.UserAccount;
import org.example.repository.EmployeeRepository;
import org.example.repository.ServiceAppointmentRepository;
import org.example.repository.ServiceRequestRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customer/service-requests")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerServiceRequestController {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ServiceAppointmentRepository serviceAppointmentRepository;
    private final UserAccountRepository userAccountRepository;
    private final EmployeeRepository employeeRepository;

    public CustomerServiceRequestController(ServiceRequestRepository serviceRequestRepository,
                                            ServiceAppointmentRepository serviceAppointmentRepository,
                                            UserAccountRepository userAccountRepository,
                                            EmployeeRepository employeeRepository) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.serviceAppointmentRepository = serviceAppointmentRepository;
        this.userAccountRepository = userAccountRepository;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping
    public List<CustomerServiceRequestDTO> getMyServiceRequests(Authentication authentication) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return serviceRequestRepository.findByCustomerId(user.getCustomerId())
                .stream()
                .sorted(Comparator.comparing(ServiceRequest::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<CustomerServiceRequestDTO> createServiceRequest(@RequestBody CustomerServiceRequestDTO dto,
                                                                          Authentication authentication) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        ServiceRequest request = new ServiceRequest();
        request.setCustomerId(user.getCustomerId());
        request.setCreatedByUserId(user.getUserId());
        request.setRequestType(dto.getRequestType());
        request.setPriority(parsePriority(dto.getPriority()));
        request.setStatus("Open");
        request.setDescription(dto.getDescription());
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        ServiceRequest saved = serviceRequestRepository.save(request);
        return ResponseEntity.ok(convertToDTO(saved));
    }

    private CustomerServiceRequestDTO convertToDTO(ServiceRequest request) {
        CustomerServiceRequestDTO dto = new CustomerServiceRequestDTO();
        dto.setRequestId(request.getRequestId());
        dto.setRequestType(request.getRequestType());
        dto.setPriority(request.getPriority() != null ? request.getPriority().name() : null);
        dto.setStatus(normalizeStatus(request.getStatus()));
        dto.setDescription(request.getDescription());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setTechnicianName(resolveEmployeeNameFromUserId(request.getAssignedTechnicianUserId()));

        List<CustomerServiceAppointmentDTO> appointments = serviceAppointmentRepository.findByRequestId(request.getRequestId())
                .stream()
                .sorted(Comparator.comparing(ServiceAppointment::getScheduledStart,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::convertAppointmentToDTO)
                .collect(Collectors.toList());

        dto.setAppointments(appointments);

        return dto;
    }

    private CustomerServiceAppointmentDTO convertAppointmentToDTO(ServiceAppointment appointment) {
        CustomerServiceAppointmentDTO dto = new CustomerServiceAppointmentDTO();
        dto.setAppointmentId(appointment.getAppointmentId());
        dto.setLocationType(appointment.getLocationType() != null ? appointment.getLocationType().name() : null);
        dto.setScheduledStart(appointment.getScheduledStart());
        dto.setScheduledEnd(appointment.getScheduledEnd());
        dto.setStatus(normalizeStatus(appointment.getStatus()));
        dto.setTechnicianName(resolveEmployeeNameFromUserId(appointment.getTechnicianUserId()));
        return dto;
    }

    private String resolveEmployeeNameFromUserId(Integer userId) {
        if (userId == null) {
            return null;
        }

        Optional<UserAccount> userOpt = userAccountRepository.findById(userId);
        if (userOpt.isEmpty() || userOpt.get().getEmployeeId() == null) {
            return null;
        }

        Optional<Employee> employeeOpt = employeeRepository.findById(userOpt.get().getEmployeeId());
        if (employeeOpt.isEmpty()) {
            return null;
        }

        Employee employee = employeeOpt.get();
        return (employee.getFirstName() + " " + employee.getLastName()).trim();
    }

    private ServiceRequest.Priority parsePriority(String rawPriority) {
        if (rawPriority == null || rawPriority.isBlank()) {
            return ServiceRequest.Priority.Medium;
        }

        String cleaned = rawPriority.trim().toLowerCase(Locale.ROOT);
        return switch (cleaned) {
            case "low" -> ServiceRequest.Priority.Low;
            case "high" -> ServiceRequest.Priority.High;
            default -> ServiceRequest.Priority.Medium;
        };
    }

    private String normalizeStatus(String rawStatus) {
        if (rawStatus == null) {
            return "Open";
        }

        String cleaned = rawStatus.replace("\"", "").trim();
        String key = cleaned.toLowerCase(Locale.ROOT).replace("_", " ");

        return switch (key) {
            case "open" -> "Open";
            case "assigned" -> "Assigned";
            case "in progress" -> "In Progress";
            case "completed" -> "Completed";
            case "cancelled", "canceled" -> "Cancelled";
            default -> cleaned;
        };
    }
}