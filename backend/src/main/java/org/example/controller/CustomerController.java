package org.example.controller;

import jakarta.transaction.Transactional;
import org.example.dto.*;
import org.example.model.*;
import org.example.repository.*;
import org.example.service.AuditService;
import org.example.util.PasswordGenerator;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final UserAccountRepository userAccountRepo;
    private final CustomerAddressRepository addressRepo;
    private final CustomerRepository customerRepo;
    private final RoleRepository roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public CustomerController(
            UserAccountRepository userAccountRepo,
            CustomerAddressRepository addressRepo,
            CustomerRepository customerRepo,
            RoleRepository roleRepo,
            PasswordEncoder passwordEncoder,
            AuditService auditService
    ) {
        this.userAccountRepo = userAccountRepo;
        this.addressRepo = addressRepo;
        this.customerRepo = customerRepo;
        this.roleRepo = roleRepo;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    // ================== GET ALL CUSTOMERS ==================
    @GetMapping("/all")
    public List<Customer> getAllCustomers() {
        return customerRepo.findAll();
    }

    // ================== GET CUSTOMER DETAIL ==================
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
        result.put("customerType", customer.getCustomerType());

        if (billing != null) {
            result.put("street1", billing.getStreet1());
            result.put("street2", billing.getStreet2());
            result.put("city", billing.getCity());
            result.put("province", billing.getProvince());
            result.put("postalCode", billing.getPostalCode());
            result.put("country", billing.getCountry());
        }

        return ResponseEntity.ok(result);
    }

    // ================== CREATE CUSTOMER ==================
    @PostMapping
    @Transactional
    public ResponseEntity<?> createCustomer(@RequestBody CreateCustomerRequest req) {

        // 1. Check duplicate email
        if (customerRepo.existsByEmail(req.email)) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        // 2. Create customer
        Customer c = new Customer();
        c.setFirstName(req.firstName);
        c.setLastName(req.lastName);
        c.setEmail(req.email);
        c.setHomePhone(req.homePhone);
        c.setCustomerType(req.customerType);

        Customer saved = customerRepo.save(c);

        // 3. Get role (DB value: Customer)
        Role role = roleRepo.findByRoleName("Customer")
                .orElseThrow(() -> new RuntimeException("Role 'Customer' not found in DB"));

        // 4. Generate temp password
        String tempPassword = PasswordGenerator.generateTempPassword(10);

        // 5. Create user account
        UserAccount ua = new UserAccount();
        ua.setCustomerId(saved.getCustomerId());
        ua.setUsername(req.email);
        ua.setRole(role);
        ua.setPasswordHash(passwordEncoder.encode(tempPassword));
        ua.setMustChangePassword(true);
        ua.setIsLocked(0);
        ua.setActive(true);

        userAccountRepo.save(ua);

        // 6. Create billing address
        CustomerAddress addr = new CustomerAddress();
        addr.setCustomerId(saved.getCustomerId());
        addr.setAddressType("Billing");
        addr.setIsPrimary(1);

        addr.setStreet1(req.street1 != null ? req.street1 : "");
        addr.setStreet2(req.street2 != null ? req.street2 : "");
        addr.setCity(req.city != null ? req.city : "");
        addr.setProvince(req.province != null ? req.province : "");
        addr.setPostalCode(req.postalCode != null ? req.postalCode : "");
        addr.setCountry(req.country != null ? req.country : "Canada");

        addressRepo.save(addr);

        // 7. Build response DTO (FOR FRONTEND POPUP)
        CreateCustomerResponseDTO dto = new CreateCustomerResponseDTO();
        dto.setCustomerId(saved.getCustomerId());
        dto.setFirstName(req.firstName);
        dto.setLastName(req.lastName);
        dto.setUsername(req.email);
        dto.setRole(role.getRoleName());
        dto.setTempPassword(tempPassword);

        return ResponseEntity.ok(dto);
    }

    // ================== UPDATE CUSTOMER ==================
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateCustomer(@PathVariable Integer id,
                                            @RequestBody CreateCustomerRequest req) {

        Customer c = customerRepo.findById(id).orElse(null);
        if (c == null) return ResponseEntity.notFound().build();

        c.setFirstName(req.firstName);
        c.setLastName(req.lastName);
        c.setEmail(req.email);
        c.setHomePhone(req.homePhone);
        c.setCustomerType(req.customerType);

        customerRepo.save(c);

        auditService.log("Customer", "Update", "Customer " + id, "system");

        return ResponseEntity.ok(c);
    }

    // ================== DELETE CUSTOMER ==================
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteCustomer(@PathVariable Integer id) {

        if (!customerRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        addressRepo.deleteAllByCustomerId(id);

        userAccountRepo.findByCustomerId(id)
                .ifPresent(userAccountRepo::delete);

        customerRepo.deleteById(id);

        auditService.log("Customer", "Delete", "Customer " + id, "system");

        return ResponseEntity.ok().build();
    }

    // ================== GET MY PROFILE ==================
    @GetMapping("/me/profile")
    public ResponseEntity<?> getMyProfile(Principal principal) {

        if (principal == null) return ResponseEntity.status(401).build();

        UserAccount ua = userAccountRepo
                .findByUsernameIgnoreCase(principal.getName())
                .orElse(null);

        if (ua == null || ua.getCustomerId() == null) {
            return ResponseEntity.status(403).build();
        }

        CustomerProfileDTO dto = new CustomerProfileDTO(
                ua.getCustomerId(),
                ua.getEmployeeId(),
                ua.getRole() != null ? ua.getRole().getRoleName() : null
        );

        return ResponseEntity.ok(dto);
    }

    // ================== UPDATE BILLING ==================
    @PutMapping("/me/billing-address")
    public ResponseEntity<?> updateMyBillingAddress(
            @RequestBody CustomerProfileDTO.AddressDTO address,
            Principal principal
    ) {

        if (principal == null) return ResponseEntity.status(401).build();

        UserAccount ua = userAccountRepo
                .findByUsernameIgnoreCase(principal.getName())
                .orElse(null);

        if (ua == null || ua.getCustomerId() == null) {
            return ResponseEntity.status(403).build();
        }

        CustomerAddress billing = addressRepo
                .findByCustomerIdAndAddressType(ua.getCustomerId(), "Billing")
                .orElse(new CustomerAddress());

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

        auditService.log("BillingAddress", "Update",
                "Customer " + ua.getCustomerId(),
                principal.getName()
        );

        return ResponseEntity.ok().build();
    }
}