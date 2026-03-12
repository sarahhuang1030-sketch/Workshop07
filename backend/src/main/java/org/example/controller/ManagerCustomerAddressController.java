package org.example.controller;

import org.example.model.CustomerAddress;
import org.example.service.CustomerAddressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.example.service.AuditService;


@RestController
@RequestMapping("/api/manager/customers/{customerId}/address")
public class ManagerCustomerAddressController {

    private final CustomerAddressService customerAddressService;
    private final AuditService auditService;

    public ManagerCustomerAddressController(CustomerAddressService customerAddressService,
                                            AuditService auditService) {
        this.customerAddressService = customerAddressService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<CustomerAddress> getAddress(@PathVariable Integer customerId) {
        CustomerAddress address = customerAddressService.getPrimaryAddress(customerId);
        if (address == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(address);
    }

    @PutMapping
    public CustomerAddress saveAddress(@PathVariable Integer customerId,
                                       @RequestBody CustomerAddress address,
                                       Authentication authentication) {
        CustomerAddress saved = customerAddressService.saveOrUpdatePrimaryAddress(customerId, address);

        String username = authentication.getName();
        String target = "Customer " + customerId + " - " + saved.getStreet1();

        auditService.log("CustomerAddress", "Update", target, username);

        return saved;
    }
}