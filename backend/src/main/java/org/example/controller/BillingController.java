package org.example.controller;

import org.example.dto.PaymentUpdateDTO;
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
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.example.service.AuditService;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final UserAccountRepository userAccountRepo;
    private final CustomerRepository customerRepo;
    private final CustomerAddressRepository customerAddressRepo;
    private final EmployeeRepository employeeRepo;
    private final PaymentAccountRepository paymentAccountRepo;
    private final AuditService auditService;

    public BillingController(UserAccountRepository userAccountRepo,
                             CustomerRepository customerRepo,
                             CustomerAddressRepository customerAddressRepo,
                             EmployeeRepository employeeRepo,
                             PaymentAccountRepository paymentAccountRepo,
                             AuditService auditService) {
        this.userAccountRepo = userAccountRepo;
        this.customerRepo = customerRepo;
        this.customerAddressRepo = customerAddressRepo;
        this.employeeRepo = employeeRepo;
        this.paymentAccountRepo = paymentAccountRepo;
        this.auditService = auditService;
    }

    // ------------------- Address Update DTO -------------------
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
        boolean isEmployee = employeeId != null;

        if (customerId == null) return ResponseEntity.status(409).body("NEEDS_REGISTRATION");

        // Prepare response map
        var out = new LinkedHashMap<String, Object>();
        out.put("customerId", customerId);
        out.put("employeeId", employeeId);

        // Name: Employee first/last takes priority
        if (isEmployee) {
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
        var uaOpt = userAccountRepo.findByUsernameIgnoreCase(key);
        if (uaOpt.isEmpty() || uaOpt.get().getCustomerId() == null) {
            return ResponseEntity.noContent().build();
        }

        Integer customerId = uaOpt.get().getCustomerId();
        var accountOpt = paymentAccountRepo.findFirstByCustomerIdOrderByCreatedAtDesc(customerId);
        if (accountOpt.isEmpty()) return ResponseEntity.noContent().build();

        PaymentAccounts account = accountOpt.get();

        BillingPaymentDTO dto = new BillingPaymentDTO();
        dto.setMethod(account.getMethod());
        dto.setHolderName(account.getHolderName());
        dto.setCardNumber(account.getCardNumber());
        dto.setCvv(account.getCvv());
        dto.setExpiredDate(account.getExpiredDate());
        dto.setLast4(account.getLast4());
        dto.setExpiryMonth(account.getExpiryMonth());
        dto.setExpiryYear(account.getExpiryYear());
        dto.setStripePaymentMethodId(account.getStripePaymentMethodId());
        dto.setBalance(account.getBalance());

        dto.setDisplayCard(account.getMethod() + " ••••" +
                (account.getLast4() != null ? account.getLast4() : ""));

        return ResponseEntity.ok(dto);
    }


    // ------------------- PUT Update Payment -------------------
    @Transactional
    @PutMapping("/payment")
    public ResponseEntity<?> updatePayment(@RequestBody PaymentUpdateDTO dto,
                                           Principal principal,
                                           Authentication auth,
                                           @AuthenticationPrincipal OAuth2User oauthUser) {

        if (principal == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        String key = resolveLoginKey(principal, auth, oauthUser);
        var uaOpt = userAccountRepo.findByUsernameIgnoreCase(key);
        if (uaOpt.isEmpty() || uaOpt.get().getCustomerId() == null) {
            return ResponseEntity.status(409).body("NEEDS_REGISTRATION");
        }

        Integer customerId = uaOpt.get().getCustomerId();

        PaymentAccounts account = paymentAccountRepo
                .findFirstByCustomerIdOrderByCreatedAtDesc(customerId)
                .orElse(new PaymentAccounts());

        account.setCustomerId(customerId);
        account.setMethod(dto.getMethod());
        account.setHolderName(dto.getHolderName());
        account.setCardNumber(dto.getCardNumber());
        account.setCvv(dto.getCvv());
        account.setExpiredDate(dto.getExpiredDate());
        account.setExpiryMonth(dto.getExpiryMonth());
        account.setExpiryYear(dto.getExpiryYear());
        account.setStripePaymentMethodId(dto.getStripePaymentMethodId());

        if (dto.getCardNumber() != null && dto.getCardNumber().length() >= 4) {
            account.setLast4(dto.getCardNumber().substring(dto.getCardNumber().length() - 4));
        } else {
            account.setLast4(null);
        }

        account.setCreatedAt(LocalDateTime.now());

        paymentAccountRepo.save(account);

        BillingPaymentDTO responseDto = new BillingPaymentDTO();
        responseDto.setMethod(account.getMethod());
        responseDto.setHolderName(account.getHolderName());
        responseDto.setCardNumber(account.getCardNumber());
        responseDto.setCvv(account.getCvv());
        responseDto.setExpiredDate(account.getExpiredDate());
        responseDto.setLast4(account.getLast4());
        responseDto.setExpiryMonth(account.getExpiryMonth());
        responseDto.setExpiryYear(account.getExpiryYear());
        responseDto.setStripePaymentMethodId(account.getStripePaymentMethodId());
        responseDto.setBalance(account.getBalance());

        responseDto.setDisplayCard(account.getMethod() + " ••••" +
                (account.getLast4() != null ? account.getLast4() : ""));

        auditService.log(
                "PaymentMethod",
                "Update",
                "Customer " + customerId + " ••••" +
                        (account.getLast4() != null ? account.getLast4() : ""),
                key
        );

        return ResponseEntity.ok(responseDto);
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

        // Update Customer info
        Customer c = customerRepo.findById(customerId).orElse(null);
        if (c == null) return ResponseEntity.status(409).body("NEEDS_REGISTRATION");

        if (req.homePhone() != null && !req.homePhone().isBlank()) c.setHomePhone(req.homePhone().trim());
        if (req.email() != null && !req.email().isBlank()) c.setEmail(req.email().trim());

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

        auditService.log(
                "BillingAddress",
                "Update",
                "Customer " + customerId + " - " + addr.getStreet1(),
                key
        );

        return ResponseEntity.ok(out);
    }

    // ------------------- Helper Methods -------------------
    /**
     * Resolve login key from Principal, OAuth2User, or Authentication token.
     * Priority: email → preferred_username → login → externalId
     */
    private String resolveLoginKey(Principal principal, Authentication auth, OAuth2User oauthUser) {
        if (auth instanceof OAuth2AuthenticationToken oauthTok) {
            Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : Map.of();

            // Try email
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