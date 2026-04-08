package org.example.controller;

import org.example.dto.CustomerDTO;
import org.example.dto.ManagerServiceAppointmentDTO;
import org.example.dto.ManagerServiceRequestDTO;
import org.example.dto.ServiceDashboardSummaryDTO;
import org.example.model.CustomerAddress;
import org.example.service.CustomerAddressService;
import org.example.service.ServiceDashboardService;
import org.example.service.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
        this.customerService=customerService;
        this.customerAddressService=customerAddressService;
    }

    @GetMapping("/summary")
    public ServiceDashboardSummaryDTO getSummary(Authentication authentication) {
        return serviceDashboardService.getSummary(authentication.getName());
    }

    @GetMapping("/tickets")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public List<ManagerServiceRequestDTO> getAssignedTickets(Authentication authentication) {
        return serviceDashboardService.getAssignedTickets(authentication.getName());
    }

    @PutMapping("/tickets/{ticketId}/status")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public ResponseEntity<Void> updateTicketStatus(@PathVariable Integer ticketId, @RequestBody Map<String, String> body) {
        serviceDashboardService.updateTicketStatus(ticketId, body.get("status"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/appointments")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public List<ManagerServiceAppointmentDTO> getAssignedAppointments(Authentication authentication) {
        return serviceDashboardService.getAssignedAppointments(authentication.getName());
    }

    @PutMapping("/appointments/{appointmentId}/status")
    @PreAuthorize("hasRole('SERVICE_TECHNICIAN')")
    public ResponseEntity<Void> updateAppointmentStatus(@PathVariable Integer appointmentId, @RequestBody Map<String, String> body) {
        serviceDashboardService.updateAppointmentStatus(appointmentId, body.get("status"));
        return ResponseEntity.ok().build();
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
}