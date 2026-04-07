package org.example.controller;

import com.stripe.model.Customer;
import org.example.dto.CustomerDTO;
import org.example.dto.ServiceDashboardSummaryDTO;
import org.example.model.CustomerAddress;
import org.example.service.CustomerAddressService;
import org.example.service.ServiceDashboardService;
import org.example.service.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
        this.customerService=customerService;
        this.customerAddressService=customerAddressService;
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
}