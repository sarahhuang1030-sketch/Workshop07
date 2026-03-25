package org.example.controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;

import org.example.dto.CustomerProfileDTO;
import org.example.model.Customer;
import org.example.model.UserAccount;
import org.example.model.CustomerAddress;
import org.example.repository.CustomerRepository;
import org.example.repository.UserAccountRepository;
import org.example.repository.CustomerAddressRepository;
import org.example.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * CustomerController.java
 *
 * Handles customer management APIs:
 * - Admins can list, view, edit, delete any customer
 * - Customers can view/update their own profile and billing info
 *
 * Created by: Sarah
 * Modified by: Sherry
 * Date: February - March 2026
 */

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final UserAccountRepository userAccountRepo;
    private final CustomerAddressRepository addressRepo;
    private final CustomerRepository customerRepo;
    private final AuditService auditService;

    public CustomerController(UserAccountRepository userAccountRepo,
                              CustomerAddressRepository addressRepo,
                              CustomerRepository customerRepo,
                              AuditService auditService) {
        this.userAccountRepo = userAccountRepo;
        this.addressRepo = addressRepo;
        this.customerRepo = customerRepo;
        this.auditService = auditService;
    }

    // ================== ADMIN: GET ALL CUSTOMERS ==================
    @GetMapping("/all")
    public List<Customer> getAllCustomers() {
        return customerRepo.findAll();
    }

    // ================== ADMIN: GET CUSTOMER DETAIL ==================
    @GetMapping("/{id}/detail")
    public ResponseEntity<?> getCustomerDetail(@PathVariable Integer id) {
        Customer customer = customerRepo.findById(id).orElse(null);
        if (customer == null) return ResponseEntity.notFound().build();

        CustomerAddress billing = addressRepo
                .findFirstByCustomerIdAndAddressTypeOrderByIsPrimaryDesc(id, "Billing")
                .orElse(null);

        HashMap<String, Object> result = new HashMap<>();
        result.put("customerId", customer.getCustomerId());
        result.put("firstName", customer.getFirstName());
        result.put("lastName", customer.getLastName());
        result.put("email", customer.getEmail());
        result.put("homePhone", customer.getHomePhone());

        if (billing != null) {
            result.put("street1", billing.getStreet1());
            result.put("street2", billing.getStreet2());
            result.put("city", billing.getCity());
            result.put("province", billing.getProvince());
            result.put("postalCode", billing.getPostalCode());
            result.put("country", billing.getCountry());
        } else {
            result.put("street1", "");
            result.put("street2", "");
            result.put("city", "");
            result.put("province", "");
            result.put("postalCode", "");
            result.put("country", "");
        }

        return ResponseEntity.ok(result);
    }

    // ================== ADMIN: CREATE CUSTOMER ==================
    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Customer c) {
        if (customerRepo.existsByEmail(c.getEmail())) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        Customer saved = customerRepo.save(c);

        auditService.log(
                "Customer",
                "Create",
                "Customer " + saved.getCustomerId(),
                "system"
        );

        return ResponseEntity.ok(saved);
    }

    // ================== ADMIN: UPDATE CUSTOMER ==================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Integer id, @RequestBody Customer updated) {
        Customer c = customerRepo.findById(id).orElse(null);
        if (c == null) return ResponseEntity.notFound().build();

        c.setFirstName(updated.getFirstName());
        c.setLastName(updated.getLastName());
        c.setEmail(updated.getEmail());
        c.setHomePhone(updated.getHomePhone());

        customerRepo.save(c);

        auditService.log(
                "Customer",
                "Update",
                "Customer " + id,
                "system"
        );

        return ResponseEntity.ok(c);
    }

    // ================== ADMIN: DELETE CUSTOMER ==================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Integer id) {
        if (!customerRepo.existsById(id)) return ResponseEntity.notFound().build();

        customerRepo.deleteById(id);

        auditService.log(
                "Customer",
                "Delete",
                "Customer " + id,
                "system"
        );

        return ResponseEntity.ok().build();
    }

    // ================== CUSTOMER SELF-SERVICE: GET PROFILE ==================
    @GetMapping("/me/profile")
    public ResponseEntity<?> getMyProfile(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();

        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (ua == null || ua.getCustomerId() == null) return ResponseEntity.status(403).build();

        CustomerProfileDTO dto = new CustomerProfileDTO(ua.getCustomerId(), ua.getEmployeeId(), ua.getRole());

        CustomerAddress billing = addressRepo.findByCustomerIdAndAddressType(ua.getCustomerId(), "Billing").orElse(null);
        if (billing != null) {
            CustomerProfileDTO.AddressDTO addr = new CustomerProfileDTO.AddressDTO();
            addr.street1 = billing.getStreet1();
            addr.street2 = billing.getStreet2();
            addr.city = billing.getCity();
            addr.province = billing.getProvince();
            addr.postalCode = billing.getPostalCode();
            addr.country = billing.getCountry();

            CustomerProfileDTO.BillingDTO billingDTO = new CustomerProfileDTO.BillingDTO();
            billingDTO.address = addr;
            dto.billing = billingDTO;
        }

        return ResponseEntity.ok(dto);
    }

    // ================== CUSTOMER SELF-SERVICE: UPDATE BILLING ==================
    @PutMapping("/me/billing-address")
    public ResponseEntity<?> updateMyBillingAddress(@RequestBody CustomerProfileDTO.AddressDTO address, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();

        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (ua == null || ua.getCustomerId() == null) return ResponseEntity.status(403).build();

        CustomerAddress billing = addressRepo.findByCustomerIdAndAddressType(ua.getCustomerId(), "Billing").orElse(new CustomerAddress());

        billing.setCustomerId(ua.getCustomerId());
        billing.setAddressType("Billing");
        billing.setStreet1(address.street1);
        billing.setStreet2(address.street2);
        billing.setCity(address.city);
        billing.setProvince(address.province);
        billing.setPostalCode(address.postalCode);
        billing.setCountry(address.country);
        billing.setIsPrimary(1);

        addressRepo.save(billing);

        auditService.log(
                "BillingAddress",
                "Update",
                "Customer " + ua.getCustomerId(),
                principal.getName()
        );

        return ResponseEntity.ok().build();
    }
}