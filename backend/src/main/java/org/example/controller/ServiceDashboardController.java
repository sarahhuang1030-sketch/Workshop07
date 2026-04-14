package org.example.controller;

import org.example.dto.*;
import org.example.model.CustomerAddress;
import org.example.service.CustomerAddressService;
import org.example.service.CustomerService;
import org.example.service.ServiceDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service")
public class ServiceDashboardController {

    private final ServiceDashboardService serviceDashboardService;
    private final CustomerService customerService;
    private final CustomerAddressService customerAddressService;

    public ServiceDashboardController(ServiceDashboardService serviceDashboardService,
                                      CustomerService customerService,
                                      CustomerAddressService customerAddressService) {
        this.serviceDashboardService = serviceDashboardService;
        this.customerService = customerService;
        this.customerAddressService = customerAddressService;
    }

    @GetMapping("/summary")
    public ServiceDashboardSummaryDTO getSummary(Authentication authentication) {
        return serviceDashboardService.getSummary(authentication.getName());
    }

    @GetMapping("/tickets")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public List<ServiceTicketDTO> getMyTickets(Authentication authentication) {
        return serviceDashboardService.getMyTickets(authentication.getName());
    }

    @PutMapping("/tickets/{requestId}/status")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public ResponseEntity<Void> updateTicketStatus(
            @PathVariable Integer requestId,
            @RequestBody String status
    ) {
        serviceDashboardService.updateTicketStatus(requestId, status);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/work-orders")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public List<ServiceWorkOrderDTO> getMyWorkOrders(Authentication authentication) {
        return serviceDashboardService.getMyWorkOrders(authentication.getName());
    }

    @PutMapping("/work-orders/{appointmentId}/status")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public ResponseEntity<Void> updateWorkOrderStatus(
            @PathVariable Integer appointmentId,
            @RequestBody String status
    ) {
        serviceDashboardService.updateWorkOrderStatus(appointmentId, status);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/customers")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public List<CustomerDTO> getCustomersForTechnician(Authentication authentication) {
        return customerService.getCustomersForTechnician(authentication.getName());
    }

    @GetMapping("/customers/{customerId}/address")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public ResponseEntity<List<CustomerAddress>> getCustomerAddressesForTechnician(
            @PathVariable Integer customerId
    ) {
        return ResponseEntity.ok(customerAddressService.getAddresses(customerId));
    }

    @PutMapping("/work-orders/{appointmentId}")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public ResponseEntity<Void> updateWorkOrder(
            @PathVariable Integer appointmentId,
            @RequestBody TechnicianWorkOrderUpdateRequest request
    ) {
        serviceDashboardService.updateWorkOrder(
                appointmentId,
                request.getStatus(),
                request.getScheduledEnd(),
                request.getNotes()
        );
        return ResponseEntity.ok().build();
    }
}