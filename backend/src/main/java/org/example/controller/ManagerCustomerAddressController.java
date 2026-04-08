package org.example.controller;

import org.example.dto.SaveMyAddressRequestDTO;
import org.example.model.CustomerAddress;
import org.example.service.AuditService;
import org.example.service.CustomerAddressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<CustomerAddress>> getAddresses(@PathVariable Integer customerId) {
        return ResponseEntity.ok(customerAddressService.getAddresses(customerId));
    }

    @PutMapping
    public CustomerAddress saveAddress(@PathVariable Integer customerId,
                                       @RequestBody SaveMyAddressRequestDTO address,
                                       Authentication authentication) {
        CustomerAddress saved = customerAddressService.saveOrUpdateAddress(customerId, address);

        String username = authentication.getName();
        String target = "Customer " + customerId + " - " + saved.getAddressType() + " - " + saved.getStreet1();

        auditService.log("CustomerAddress", "Update", target, username);

        return saved;
    }

    @DeleteMapping("/{addressType}")
    public ResponseEntity<Void> deleteAddressByType(@PathVariable Integer customerId,
                                                    @PathVariable String addressType,
                                                    Authentication authentication) {
        customerAddressService.deleteAddressByType(customerId, addressType);

        String username = authentication.getName();
        String target = "Customer " + customerId + " - " + addressType;

        auditService.log("CustomerAddress", "Delete", target, username);

        return ResponseEntity.noContent().build();
    }
}