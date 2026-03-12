package org.example.controller;

import org.example.model.Customer;
import org.example.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.example.service.AuditService;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/manager/customers")
public class ManagerCustomerController {

    private final CustomerService customerService;
    private final AuditService auditService;

    public ManagerCustomerController(CustomerService customerService,
                                     AuditService auditService) {
        this.customerService = customerService;
        this.auditService = auditService;
    }

    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    @GetMapping("/{id}")
    public Customer getCustomerById(@PathVariable Integer id) {
        return customerService.getCustomerById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Customer createCustomer(@RequestBody Customer customer,
                                   Authentication authentication) {
        Customer saved = customerService.createCustomer(customer);

        String username = authentication.getName();
        String target = "Customer " + saved.getCustomerId() + " - "
                + saved.getFirstName() + " " + saved.getLastName();

        auditService.log("Customer", "Create", target, username);

        return saved;
    }

    @PutMapping("/{id}")
    public Customer updateCustomer(@PathVariable Integer id,
                                   @RequestBody Customer customer,
                                   Authentication authentication) {
        Customer saved = customerService.updateCustomer(id, customer);

        String username = authentication.getName();
        String target = "Customer " + saved.getCustomerId() + " - "
                + saved.getFirstName() + " " + saved.getLastName();

        auditService.log("Customer", "Update", target, username);

        return saved;
    }


    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCustomer(@PathVariable Integer id,
                               Authentication authentication) {
        Customer customer = customerService.getCustomerById(id);

        String username = authentication.getName();
        String target = "Customer " + customer.getCustomerId() + " - "
                + customer.getFirstName() + " " + customer.getLastName();

        customerService.deleteCustomer(id);

        auditService.log("Customer", "Delete", target, username);
    }
}