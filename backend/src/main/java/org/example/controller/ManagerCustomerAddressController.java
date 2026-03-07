package org.example.controller;

import org.example.model.CustomerAddress;
import org.example.service.CustomerAddressService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/customers/{customerId}/address")
public class ManagerCustomerAddressController {

    private final CustomerAddressService customerAddressService;

    public ManagerCustomerAddressController(CustomerAddressService customerAddressService) {
        this.customerAddressService = customerAddressService;
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
                                       @RequestBody CustomerAddress address) {
        return customerAddressService.saveOrUpdatePrimaryAddress(customerId, address);
    }
}