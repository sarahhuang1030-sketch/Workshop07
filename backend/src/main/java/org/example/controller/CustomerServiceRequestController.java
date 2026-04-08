package org.example.controller;

import org.example.dto.CustomerServiceAppointmentDTO;
import org.example.dto.CustomerServiceRequestDTO;
import org.example.model.ServiceRequest;
import org.example.model.UserAccount;
import org.example.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
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
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<CustomerServiceRequestDTO> createServiceRequest(@RequestBody CustomerServiceRequestDTO dto, Authentication authentication) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        ServiceRequest request = new ServiceRequest();
        request.setCustomerId(user.getCustomerId());
        request.setCreatedByUserId(user.getUserId());
        request.setRequestType(dto.getRequestType());
        request.setPriority(dto.getPriority() != null ? ServiceRequest.Priority.valueOf(dto.getPriority()) : ServiceRequest.Priority.Medium);
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
        dto.setStatus(request.getStatus());
        dto.setDescription(request.getDescription());
        dto.setCreatedAt(request.getCreatedAt());

        if (request.getAssignedTechnicianUserId() != null) {
            userAccountRepository.findById(request.getAssignedTechnicianUserId()).ifPresent(ua -> {
                if (ua.getEmployeeId() != null) {
                    employeeRepository.findById(ua.getEmployeeId()).ifPresent(emp -> {
                        dto.setTechnicianName(emp.getFirstName() + " " + emp.getLastName());
                    });
                }
            });
        }

        dto.setAppointments(serviceAppointmentRepository.findByRequestId(request.getRequestId())
                .stream()
                .map(appt -> {
                    CustomerServiceAppointmentDTO apptDto = new CustomerServiceAppointmentDTO();
                    apptDto.setAppointmentId(appt.getAppointmentId());
                    apptDto.setLocationType(appt.getLocationType() != null ? appt.getLocationType().name() : null);
                    apptDto.setScheduledStart(appt.getScheduledStart());
                    apptDto.setScheduledEnd(appt.getScheduledEnd());
                    apptDto.setStatus(appt.getStatus());

                    if (appt.getTechnicianUserId() != null) {
                        userAccountRepository.findById(appt.getTechnicianUserId()).ifPresent(ua -> {
                            if (ua.getEmployeeId() != null) {
                                employeeRepository.findById(ua.getEmployeeId()).ifPresent(emp -> {
                                    apptDto.setTechnicianName(emp.getFirstName() + " " + emp.getLastName());
                                });
                            }
                        });
                    }
                    return apptDto;
                })
                .collect(Collectors.toList()));

        return dto;
    }
}
