package org.example.controller;

import org.example.dto.PaymentUpdateDTO;
import org.example.entity.PaymentAccounts;
import org.example.model.Customer;
import org.example.model.CustomerAddress;
import org.example.model.UserAccount;
import org.example.repository.*;
import org.example.service.AuditService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final UserAccountRepository userAccountRepo;
    private final CustomerRepository customerRepo;
    private final CustomerAddressRepository customerAddressRepo;
    private final EmployeeRepository employeeRepo;
    private final PaymentAccountRepository paymentAccountRepo;
    private final AuditService auditService;

    public BillingController(
            UserAccountRepository userAccountRepo,
            CustomerRepository customerRepo,
            CustomerAddressRepository customerAddressRepo,
            EmployeeRepository employeeRepo,
            PaymentAccountRepository paymentAccountRepo,
            AuditService auditService
    ) {
        this.userAccountRepo = userAccountRepo;
        this.customerRepo = customerRepo;
        this.customerAddressRepo = customerAddressRepo;
        this.employeeRepo = employeeRepo;
        this.paymentAccountRepo = paymentAccountRepo;
        this.auditService = auditService;
    }

    // =========================================================
    // DTO
    // =========================================================
    public record AddressUpdateRequest(
            String street1,
            String street2,
            String city,
            String province,
            String postalCode,
            String country,
            String homePhone,
            String firstName,
            String lastName,
            String email
    ) {}

    // =========================================================
    // GET Billing Address (MERGED VERSION)
    // =========================================================
    @GetMapping("/address")
    public ResponseEntity<?> getBillingAddress(
            Principal principal,
            Authentication auth,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {

        if (principal == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        String key = resolveLoginKey(principal, auth, oauthUser);

        var ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        if (ua == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        Integer customerId = ua.getCustomerId();
        Integer employeeId = ua.getEmployeeId();
        boolean isEmployee = employeeId != null;

        var out = new LinkedHashMap<String, Object>();
        out.put("customerId", customerId);
        out.put("employeeId", employeeId);

        Customer customer = null;

        if (customerId != null) {
            customer = customerRepo.findById(customerId).orElse(null);
        }

        // =========================
        // NAME + EMAIL RESOLUTION (MERGED LOGIC)
        // =========================
        if (isEmployee && employeeId != null) {

            employeeRepo.findById(employeeId).ifPresent(emp -> {
                out.put("firstName", emp.getFirstName());
                out.put("lastName", emp.getLastName());
                out.put("email", emp.getEmail()); // employee email priority
            });

        } else if (customer != null) {

            out.put("firstName", customer.getFirstName());
            out.put("lastName", customer.getLastName());
            out.put("email", customer.getEmail()); // customer email

        } else {
            // fallback (old logic compatibility)
            out.put("email", ua.getUsername());
        }

        // =========================
        // PHONE (MERGED)
        // =========================
        if (customer != null) {
            out.put("homePhone", customer.getHomePhone());
        }

        // employee fallback phone (old version behavior)
        if (isEmployee && customer == null && employeeId != null) {
            employeeRepo.findById(employeeId).ifPresent(emp -> {
                out.put("homePhone", emp.getPhone());
            });
        }

        // =========================
        // ADDRESS
        // =========================
        if (customerId != null) {
            customerAddressRepo
                    .findFirstByCustomerIdAndAddressTypeOrderByIsPrimaryDesc(customerId, "Billing")
                    .ifPresent(addr -> {
                        out.put("street1", addr.getStreet1());
                        out.put("street2", addr.getStreet2());
                        out.put("city", addr.getCity());
                        out.put("province", addr.getProvince());
                        out.put("postalCode", addr.getPostalCode());
                        out.put("country", addr.getCountry());
                    });
        }

        return ResponseEntity.ok(out);
    }

    // =========================================================
    // PUT Billing Address (MERGED VERSION)
    // =========================================================
    @Transactional
    @PutMapping("/address")
    public ResponseEntity<?> updateAddress(
            Principal principal,
            Authentication auth,
            @AuthenticationPrincipal OAuth2User oauthUser,
            @RequestBody AddressUpdateRequest req
    ) {

        if (principal == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        String key = resolveLoginKey(principal, auth, oauthUser);

        var ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        if (ua == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        Customer customer = ensureCustomer(ua);
        Integer customerId = customer.getCustomerId();

        Integer employeeId = ua.getEmployeeId();
        boolean isEmployee = employeeId != null;

        // =========================
        // UPDATE CUSTOMER CORE
        // =========================
        if (req.homePhone() != null) {
            customer.setHomePhone(req.homePhone().trim());
        }

        // email update (merged rule: allow both roles)
        if (req.email() != null) {
            customer.setEmail(req.email().trim());
        }

        // name rules (merged old + new logic)
        if (isEmployee) {

            employeeRepo.findById(employeeId).ifPresent(emp -> {
                if (req.firstName() != null) emp.setFirstName(req.firstName().trim());
                if (req.lastName() != null) emp.setLastName(req.lastName().trim());

                // employee email override allowed
                if (req.email() != null) emp.setEmail(req.email().trim());

                employeeRepo.save(emp);
            });

        } else {

            if (req.firstName() != null) {
                customer.setFirstName(req.firstName().trim());
            }
            if (req.lastName() != null) {
                customer.setLastName(req.lastName().trim());
            }
        }

        customerRepo.save(customer);

        // =========================
        // UPSERT ADDRESS
        // =========================
        CustomerAddress addr = customerAddressRepo
                .findFirstByCustomerIdAndAddressTypeOrderByIsPrimaryDesc(customerId, "Billing")
                .orElseGet(() -> {
                    CustomerAddress a = new CustomerAddress();
                    a.setCustomerId(customerId);
                    a.setAddressType("Billing");
                    a.setIsPrimary(1);
                    return a;
                });

        addr.setStreet1(req.street1());
        addr.setStreet2(req.street2());
        addr.setCity(req.city());
        addr.setProvince(req.province());
        addr.setPostalCode(req.postalCode());
        addr.setCountry(req.country());

        customerAddressRepo.save(addr);

        // =========================
        // RESPONSE (MERGED)
        // =========================
        var out = new LinkedHashMap<String, Object>();

        out.put("customerId", customerId);
        out.put("email", isEmployee ? req.email() : customer.getEmail());
        out.put("homePhone", customer.getHomePhone());

        out.put("street1", addr.getStreet1());
        out.put("street2", addr.getStreet2());
        out.put("city", addr.getCity());
        out.put("province", addr.getProvince());
        out.put("postalCode", addr.getPostalCode());
        out.put("country", addr.getCountry());

        if (isEmployee) {
            employeeRepo.findById(employeeId).ifPresent(emp -> {
                out.put("firstName", emp.getFirstName());
                out.put("lastName", emp.getLastName());
            });
        } else {
            out.put("firstName", customer.getFirstName());
            out.put("lastName", customer.getLastName());
        }

        auditService.log(
                "BillingAddress",
                "Update",
                "Customer " + customerId,
                key
        );

        return ResponseEntity.ok(out);
    }

    // =========================================================
    // ENSURE CUSTOMER (MERGED LOGIC - ENHANCED)
    // =========================================================
    private Customer ensureCustomer(UserAccount ua) {

        if (ua.getCustomerId() != null) {
            return customerRepo.findById(ua.getCustomerId()).orElse(null);
        }

        Customer c = new Customer();
        c.setCustomerType("Individual");
        c.setHomePhone("");

        if (ua.getEmployeeId() != null) {
            employeeRepo.findById(ua.getEmployeeId()).ifPresent(emp -> {
                c.setFirstName(emp.getFirstName());
                c.setLastName(emp.getLastName());
                c.setEmail(emp.getEmail());
                c.setHomePhone(emp.getPhone());
            });
        }

        if (c.getEmail() == null || c.getEmail().isBlank()) {
            c.setFirstName("");
            c.setLastName("");
            c.setEmail(ua.getUsername());
        }

        Customer saved = customerRepo.save(c);

        ua.setCustomerId(saved.getCustomerId());
        userAccountRepo.save(ua);

        return saved;
    }

    // =========================================================
    // LOGIN KEY RESOLVER (UNCHANGED)
    // =========================================================
    private String resolveLoginKey(Principal principal, Authentication auth, OAuth2User oauthUser) {

        if (auth instanceof OAuth2AuthenticationToken oauthTok) {

            Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : Map.of();

            Object email = attrs.get("email");
            if (email != null && !email.toString().isBlank()) return email.toString().trim();

            Object preferred = attrs.get("preferred_username");
            if (preferred != null && !preferred.toString().isBlank()) return preferred.toString().trim();

            Object login = attrs.get("login");
            if (login != null && !login.toString().isBlank()) return login.toString().trim();

            String provider = oauthTok.getAuthorizedClientRegistrationId().toLowerCase();
            return provider + ":" + attrs.getOrDefault("sub", principal.getName());
        }

        return principal.getName();
    }
}