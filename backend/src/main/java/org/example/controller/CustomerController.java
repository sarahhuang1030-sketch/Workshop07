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

        // =========================
        // 1. Validate duplicate email
        // =========================
        if (customerRepo.existsByEmail(req.email)) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        // =========================
        // 2. Normalize + validate postal code
        // =========================
        String normalizedPostalCode = req.postalCode != null
                ? req.postalCode.trim().toUpperCase()
                : null;

        // Accept A1A1A1 or A1A 1A1 → normalize to A1A 1A1
        if (normalizedPostalCode != null && !normalizedPostalCode.isBlank()
                && !normalizedPostalCode.matches("^[A-Z]\\d[A-Z][ ]?\\d[A-Z]\\d$")) {
            return ResponseEntity.badRequest().body("Invalid postal code format");
        }

        if (normalizedPostalCode != null) {
            normalizedPostalCode = normalizedPostalCode.replaceAll("\\s+", "");
            if (normalizedPostalCode.length() == 6) {
                normalizedPostalCode =
                        normalizedPostalCode.substring(0, 3) + " " +
                                normalizedPostalCode.substring(3);
            }
        }

        // =========================
        // 3. Create Customer entity
        // =========================
        Customer c = new Customer();
        c.setFirstName(req.firstName);
        c.setLastName(req.lastName);
        c.setBusinessName(req.businessName);
        c.setEmail(req.email);
        c.setHomePhone(req.homePhone);
        c.setCustomerType(req.customerType);

        // default status if missing
        c.setStatus((req.status == null || req.status.isBlank())
                ? "Active"
                : req.status);

        Customer saved = customerRepo.save(c);

        // =========================
        // 4. Get CUSTOMER role
        // =========================
        Role role = roleRepo.findByRoleName("Customer")
                .orElseThrow(() -> new RuntimeException("Role 'Customer' not found"));

        // =========================
        // 5. Generate username
        // =========================
        String baseUsername;

        if ("Business".equalsIgnoreCase(req.customerType)) {
            // business → use business name
            String business = req.businessName != null ? req.businessName : "customer";

            baseUsername = business.toLowerCase()
                    .replaceAll("\\s+", "")
                    .replaceAll("[^a-z0-9.]", "");
        } else {
            // individual → firstname.lastname
            String first = req.firstName != null ? req.firstName : "customer";
            String last = req.lastName != null ? req.lastName : "";

            baseUsername = (first + "." + last).toLowerCase()
                    .replaceAll("\\s+", "")
                    .replaceAll("[^a-z0-9.]", "");
        }

        // fallback if too short
        if (baseUsername.length() < 3) {
            baseUsername = "user" + System.currentTimeMillis();
        }

        // ensure uniqueness
        String username = baseUsername;
        int counter = 1;

        while (userAccountRepo.existsByUsernameIgnoreCase(username)) {
            username = baseUsername + "_" + counter;
            counter++;

            if (counter > 100) {
                throw new RuntimeException("Cannot generate unique username");
            }
        }

        // =========================
        // 6. Generate temp password
        // =========================
        String tempPassword = PasswordGenerator.generateTempPassword(10);

        // =========================
        // 7. Create UserAccount
        // =========================
        UserAccount ua = new UserAccount();
        ua.setCustomerId(saved.getCustomerId());
        ua.setUsername(username);
        ua.setRole(role);
        ua.setPasswordHash(passwordEncoder.encode(tempPassword));

        ua.setMustChangePassword(true); // force reset on first login
        ua.setIsLocked(0);
        ua.setIsActive(true);

        userAccountRepo.save(ua);

        // =========================
        // 8. Create Billing Address
        // =========================
        CustomerAddress addr = new CustomerAddress();
        addr.setCustomerId(saved.getCustomerId());
        addr.setAddressType("Billing");
        addr.setIsPrimary(1);

        addr.setStreet1(req.street1 != null ? req.street1 : "");
        addr.setStreet2(req.street2 != null ? req.street2 : "");
        addr.setCity(req.city != null ? req.city : "");
        addr.setProvince(req.province != null ? req.province : "");
        addr.setPostalCode(normalizedPostalCode != null ? normalizedPostalCode : "");
        addr.setCountry(req.country != null && !req.country.isBlank() ? req.country : "Canada");

        addressRepo.save(addr);

        // =========================
        // 9. Build response (for UI)
        // =========================
        CreateCustomerResponseDTO dto = new CreateCustomerResponseDTO();
        dto.setCustomerId(saved.getCustomerId());
        dto.setFirstName(saved.getFirstName());
        dto.setLastName(saved.getLastName());
        dto.setUsername(username);
        dto.setRole(role.getRoleName());
        dto.setTempPassword(tempPassword);

        return ResponseEntity.ok(dto);
    }

    // ================== UPDATE CUSTOMER ==================
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateCustomer(@PathVariable Integer id,
                                            @RequestBody CreateCustomerRequest req) {

        // =========================
        // 1. Find existing customer
        // =========================
        Customer c = customerRepo.findById(id).orElse(null);
        if (c == null) {
            return ResponseEntity.notFound().build();
        }

        // =========================
        // 2. Normalize + validate postal code
        // =========================
        String normalizedPostalCode = req.postalCode != null
                ? req.postalCode.trim().toUpperCase()
                : null;

        if (normalizedPostalCode != null && !normalizedPostalCode.isBlank()
                && !normalizedPostalCode.matches("^[A-Z]\\d[A-Z][ ]?\\d[A-Z]\\d$")) {
            return ResponseEntity.badRequest().body("Invalid postal code format");
        }

        if (normalizedPostalCode != null) {
            normalizedPostalCode = normalizedPostalCode.replaceAll("\\s+", "");
            if (normalizedPostalCode.length() == 6) {
                normalizedPostalCode =
                        normalizedPostalCode.substring(0, 3) + " " +
                                normalizedPostalCode.substring(3);
            }
        }

        // =========================
        // 3. Update customer fields
        // =========================
        c.setFirstName(req.firstName);
        c.setLastName(req.lastName);
        c.setBusinessName(req.businessName);
        c.setEmail(req.email);
        c.setHomePhone(req.homePhone);
        c.setCustomerType(req.customerType);

        // keep existing status if not provided
        if (req.status != null && !req.status.isBlank()) {
            c.setStatus(req.status);
        }

        customerRepo.save(c);

        // =========================
        // 4. Update or create billing address
        // =========================
        CustomerAddress billing = addressRepo
                .findByCustomerIdAndAddressType(id, "Billing")
                .orElse(new CustomerAddress());

        billing.setCustomerId(id);
        billing.setAddressType("Billing");
        billing.setIsPrimary(1);

        billing.setStreet1(req.street1 != null ? req.street1 : "");
        billing.setStreet2(req.street2 != null ? req.street2 : "");
        billing.setCity(req.city != null ? req.city : "");
        billing.setProvince(req.province != null ? req.province : "");
        billing.setPostalCode(normalizedPostalCode != null ? normalizedPostalCode : "");
        billing.setCountry(req.country != null && !req.country.isBlank() ? req.country : "Canada");

        addressRepo.save(billing);

        // =========================
        // 5. Audit log
        // =========================
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