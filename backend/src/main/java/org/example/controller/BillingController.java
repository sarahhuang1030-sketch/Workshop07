package org.example.controller;

import org.example.entity.PaymentAccounts;
import org.example.model.Customer;
import org.example.model.CustomerAddress;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.UserAccountRepository;
import org.example.repository.EmployeeRepository;
import org.example.repository.PaymentAccountRepository;
import org.example.dto.BillingPaymentDTO;

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

    public BillingController(UserAccountRepository userAccountRepo,
                             CustomerRepository customerRepo,
                             CustomerAddressRepository customerAddressRepo,
                             EmployeeRepository employeeRepo,
                             PaymentAccountRepository paymentAccountRepo) {
        this.userAccountRepo = userAccountRepo;
        this.customerRepo = customerRepo;
        this.customerAddressRepo = customerAddressRepo;
        this.employeeRepo = employeeRepo;
        this.paymentAccountRepo = paymentAccountRepo;
    }

    // DTO for updating address
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

    // ------------------- GET Billing Address -------------------
    @GetMapping("/address")
    public ResponseEntity<?> getBillingAddress(Principal principal,
                                               Authentication auth,
                                               @AuthenticationPrincipal OAuth2User oauthUser) {
        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveLoginKey(principal, auth, oauthUser);
        if (key == null || key.isBlank()) return ResponseEntity.status(401).body("Not authenticated");

        var uaOpt = userAccountRepo.findByUsernameIgnoreCase(key);
        if (uaOpt.isEmpty()) return ResponseEntity.status(409).body("NEEDS_REGISTRATION");

        var ua = uaOpt.get();
        Integer customerId = ua.getCustomerId();
        Integer employeeId = ua.getEmployeeId();

        if (customerId == null) return ResponseEntity.status(409).body("NEEDS_REGISTRATION");

        // Prepare response map
        var out = new LinkedHashMap<String, Object>();
        out.put("customerId", customerId);
        out.put("employeeId", employeeId);

        // Get name: Employee first/last takes priority
        if (employeeId != null) {
            employeeRepo.findById(employeeId).ifPresent(emp -> {
                out.put("firstName", emp.getFirstName());
                out.put("lastName", emp.getLastName());
            });
        } else {
            customerRepo.findById(customerId).ifPresent(c -> {
                out.put("firstName", c.getFirstName());
                out.put("lastName", c.getLastName());
            });
        }

        // Email & phone from Customer table
        customerRepo.findById(customerId).ifPresent(c -> {
            out.put("email", c.getEmail());
            out.put("homePhone", c.getHomePhone());
        });

        // Fetch primary billing address
        var addr = customerAddressRepo
                .findFirstByCustomerIdAndAddressTypeOrderByIsPrimaryDesc(customerId, "Billing")
                .orElse(null);
        if (addr != null) {
            out.put("street1", addr.getStreet1());
            out.put("street2", addr.getStreet2());
            out.put("city", addr.getCity());
            out.put("province", addr.getProvince());
            out.put("postalCode", addr.getPostalCode());
            out.put("country", addr.getCountry());
        }

        return ResponseEntity.ok(out);
    }

    // ------------------- GET Payment Info -------------------
    @GetMapping("/payment")
    public ResponseEntity<?> getPayment(Principal principal,
                                        @AuthenticationPrincipal OAuth2User oauthUser) {
        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveLoginKey(principal, null, oauthUser);
        if (key == null || key.isBlank()) return ResponseEntity.status(401).body("Not authenticated");

        var ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        if (ua == null || ua.getCustomerId() == null) return ResponseEntity.ok(null);

        Integer customerId = ua.getCustomerId();

        var accountOpt = paymentAccountRepo.findFirstByCustomerIdOrderByCreatedAtDesc(customerId);
        if (accountOpt.isEmpty()) return ResponseEntity.ok(null);

        PaymentAccounts account = accountOpt.get();

        BillingPaymentDTO dto = new BillingPaymentDTO();
        dto.setMethod(account.getMethod());
        dto.setExpiredDate(account.getExpiredDate());
        dto.setBalance(account.getBalance());

        // Only return last 4 digits of card
        String card = account.getCardNumber();
        if (card != null && card.length() >= 4) {
            dto.setLast4(card.substring(card.length() - 4));
        }

        return ResponseEntity.ok(dto);
    }

    // ------------------- PUT Update Address -------------------
    @Transactional
    @PutMapping("/address")
    public ResponseEntity<?> updateAddress(Principal principal,
                                           Authentication auth,
                                           @AuthenticationPrincipal OAuth2User oauthUser,
                                           @RequestBody AddressUpdateRequest req) {
        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveLoginKey(principal, auth, oauthUser);
        if (key == null || key.isBlank()) return ResponseEntity.status(401).body("Not authenticated");

        var uaOpt = userAccountRepo.findByUsernameIgnoreCase(key);
        if (uaOpt.isEmpty()) return ResponseEntity.status(409).body("NEEDS_REGISTRATION");

        var ua = uaOpt.get();
        Integer customerId = ua.getCustomerId();
        Integer employeeId = ua.getEmployeeId();
        boolean isEmployee = employeeId != null;

        if (customerId == null) return ResponseEntity.status(409).body("NEEDS_REGISTRATION");

        // Update basic customer fields
        Customer c = customerRepo.findById(customerId).orElse(null);
        if (c == null) return ResponseEntity.status(409).body("NEEDS_REGISTRATION");

        if (req.homePhone() != null && !req.homePhone().isBlank()) c.setHomePhone(req.homePhone().trim());
        if (req.email() != null && !req.email().isBlank()) c.setEmail(req.email().trim());

        // Only allow updating names if not an employee
        if (!isEmployee) {
            if (req.firstName() != null && !req.firstName().isBlank()) c.setFirstName(req.firstName().trim());
            if (req.lastName() != null && !req.lastName().isBlank()) c.setLastName(req.lastName().trim());
        }

        customerRepo.save(c);

        // Upsert billing address
        var addr = customerAddressRepo
                .findFirstByCustomerIdAndAddressTypeOrderByIsPrimaryDesc(customerId, "Billing")
                .orElseGet(() -> {
                    var a = new CustomerAddress();
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

        // Prepare response
        var out = new LinkedHashMap<String, Object>();
        out.put("street1", addr.getStreet1());
        out.put("street2", addr.getStreet2());
        out.put("city", addr.getCity());
        out.put("province", addr.getProvince());
        out.put("postalCode", addr.getPostalCode());
        out.put("country", addr.getCountry());
        out.put("customerId", customerId);
        out.put("homePhone", c.getHomePhone());
        out.put("email", c.getEmail());

        if (isEmployee) {
            employeeRepo.findById(employeeId).ifPresent(emp -> {
                out.put("firstName", emp.getFirstName());
                out.put("lastName", emp.getLastName());
            });
        } else {
            out.put("firstName", c.getFirstName());
            out.put("lastName", c.getLastName());
        }

        return ResponseEntity.ok(out);
    }



    // ------------------- Helper Methods -------------------
    /**
     * Resolve login key from Principal, OAuth2User, or Authentication token.
     * Priority: Email → preferred_username → login/username → externalId
     */
    private String resolveLoginKey(Principal principal, Authentication auth, OAuth2User oauthUser) {
        if (auth instanceof OAuth2AuthenticationToken oauthTok) {
            Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : Map.of();

            // Try email first
            Object email = attrs.get("email");
            if (email != null && !email.toString().isBlank()) return email.toString().trim();

            // Try preferred_username
            Object preferred = attrs.get("preferred_username");
            if (preferred != null && !preferred.toString().isBlank()) return preferred.toString().trim();

            // Try login
            Object login = attrs.get("login");
            if (login != null && !login.toString().isBlank()) return login.toString().trim();

            // Fall back to externalId
            String provider = oauthTok.getAuthorizedClientRegistrationId().toLowerCase();
            String externalId = firstNonBlank(str(attrs.get("sub")), str(attrs.get("id")), str(attrs.get("login")));
            if (externalId != null && !externalId.isBlank()) return (provider + ":" + externalId).toLowerCase();
        }

        // Default: principal name
        return principal.getName();
    }

    private static String str(Object o) {
        return o == null ? null : o.toString().trim();
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.trim().isEmpty()) return v.trim();
        }
        return null;
    }

}