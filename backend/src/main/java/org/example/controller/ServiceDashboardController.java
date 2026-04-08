package org.example.controller;

import com.stripe.model.Customer;
import org.example.dto.*;
import org.example.model.CustomerAddress;
import org.example.model.ServiceAppointment;
import org.example.model.ServiceRequest;
import org.example.model.UserAccount;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.ServiceAppointmentRepository;
import org.example.repository.ServiceRequestRepository;
import org.example.repository.UserAccountRepository;
import org.example.service.CustomerAddressService;
import org.example.service.ServiceDashboardService;
import org.example.service.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/service")
public class ServiceDashboardController {

    private final ServiceDashboardService serviceDashboardService;
    private final CustomerService customerService;
    private final CustomerAddressService customerAddressService;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ServiceAppointmentRepository serviceAppointmentRepository;
    private final UserAccountRepository userAccountRepository;
    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository customerAddressRepository;

    public ServiceDashboardController(ServiceDashboardService serviceDashboardService,
                                      CustomerService customerService,
                                      CustomerAddressService customerAddressService,
                                      ServiceRequestRepository serviceRequestRepository,
                                      ServiceAppointmentRepository serviceAppointmentRepository,
                                      UserAccountRepository userAccountRepository,
                                      CustomerRepository customerRepository,
                                      CustomerAddressRepository customerAddressRepository) {
        this.serviceDashboardService = serviceDashboardService;
        this.customerService=customerService;
        this.customerAddressService=customerAddressService;
        this.serviceRequestRepository = serviceRequestRepository;
        this.serviceAppointmentRepository = serviceAppointmentRepository;
        this.userAccountRepository = userAccountRepository;
        this.customerRepository = customerRepository;
        this.customerAddressRepository = customerAddressRepository;
    }

    @GetMapping("/summary")
    public ServiceDashboardSummaryDTO getSummary(Authentication authentication) {
        return serviceDashboardService.getSummary(authentication.getName());
    }

    @GetMapping("/customers")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public List<CustomerDTO> getCustomersForTechnician(Authentication authentication) {
        return customerService.getCustomersForTechnician(authentication.getName());
    }

    @GetMapping("/customers/{customerId}/address")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public ResponseEntity<CustomerAddress> getCustomerAddressForTechnician(@PathVariable Integer customerId) {
        CustomerAddress address = customerAddressService.getPrimaryAddress(customerId);
        if (address == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(address);
    }

    @GetMapping("/tickets")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public ResponseEntity<List<ManagerServiceRequestDTO>> getAssignedTickets(Authentication authentication) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ManagerServiceRequestDTO> requests = serviceRequestRepository.findByAssignedTechnicianUserId(user.getUserId())
                .stream()
                .map(this::toRequestDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(requests);
    }

    @PutMapping("/tickets/{id}")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public ResponseEntity<ServiceRequest> updateTicketStatus(@PathVariable Integer id, @RequestBody ServiceRequest updated, Authentication authentication) {
        return serviceRequestRepository.findById(id)
                .map(existing -> {
                    existing.setStatus(updated.getStatus());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(serviceRequestRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/work-orders")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public ResponseEntity<List<ServiceAppointmentDTO>> getAssignedWorkOrders(Authentication authentication) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ServiceAppointmentDTO> appointments = serviceAppointmentRepository.findByTechnicianUserId(user.getUserId())
                .stream()
                .map(this::toAppointmentDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(appointments);
    }

    @PutMapping("/work-orders/{id}")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public ResponseEntity<ServiceAppointment> updateWorkOrderStatus(@PathVariable Integer id, @RequestBody ServiceAppointment updated, Authentication authentication) {
        return serviceAppointmentRepository.findById(id)
                .map(existing -> {
                    existing.setStatus(updated.getStatus());
                    return ResponseEntity.ok(serviceAppointmentRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
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
        return dto;
    }

    private ServiceAppointmentDTO toAppointmentDTO(ServiceAppointment appointment) {
        ServiceAppointmentDTO dto = new ServiceAppointmentDTO();
        dto.setAppointmentId(appointment.getAppointmentId());
        dto.setRequestId(appointment.getRequestId());
        dto.setTechnicianUserId(appointment.getTechnicianUserId());
        dto.setAddressId(appointment.getAddressId());
        dto.setLocationType(appointment.getLocationType() != null ? appointment.getLocationType().name() : null);
        dto.setScheduledStart(appointment.getScheduledStart());
        dto.setScheduledEnd(appointment.getScheduledEnd());
        dto.setStatus(appointment.getStatus());
        dto.setNotes(appointment.getNotes());

        dto.setAddressText(
                appointment.getAddressId() != null
                        ? customerAddressRepository.findById(Long.valueOf(appointment.getAddressId()))
                        .map(a -> {
                            String street1 = a.getStreet1() != null ? a.getStreet1() : "";
                            String street2 = a.getStreet2() != null ? a.getStreet2() : "";
                            String city = a.getCity() != null ? a.getCity() : "";
                            String province = a.getProvince() != null ? a.getProvince() : "";
                            String postalCode = a.getPostalCode() != null ? a.getPostalCode() : "";
                            return (street1 + " " + street2 + ", " + city + ", " + province + " " + postalCode).trim();
                        })
                        .orElse("—")
                        : "—"
        );
        return dto;
    }
}