package org.example.controller;

import org.example.model.Customer;
import org.example.model.CustomerAddress;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.UserAccountRepository;
import org.example.repository.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;

import java.security.Principal;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final UserAccountRepository userAccountRepo;
    private final CustomerRepository customerRepo;
    private final CustomerAddressRepository customerAddressRepo;
    private final EmployeeRepository employeeRepo;

    public BillingController(
            UserAccountRepository userAccountRepo,
            CustomerRepository customerRepo,
            CustomerAddressRepository customerAddressRepo,
            EmployeeRepository employeeRepo
    ) {
        this.userAccountRepo = userAccountRepo;
        this.customerRepo = customerRepo;
        this.customerAddressRepo = customerAddressRepo;
        this.employeeRepo = employeeRepo;
    }

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

    @GetMapping("/address")
    public ResponseEntity<?> getBillingAddress(Principal principal,
                                               Authentication auth,
                                               @AuthenticationPrincipal OAuth2User oauthUser) {

        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveLoginKey(principal, auth, oauthUser);
        if (key == null || key.isBlank()) return ResponseEntity.status(401).body("Not authenticated");

        var uaOpt = userAccountRepo.findByUsernameIgnoreCase(key);
        if (uaOpt.isEmpty()) {
            // no UserAccount yet -> must complete profile
            return ResponseEntity.status(409).body("NEEDS_REGISTRATION");
        }

        var ua = uaOpt.get();

        Integer customerId = ua.getCustomerId();
        Integer employeeId = ua.getEmployeeId();

        // If no customer profile yet -> 409
        if (customerId == null) {
            return ResponseEntity.status(409).body("NEEDS_REGISTRATION");
        }

        var out = new LinkedHashMap<String, Object>();
        out.put("customerId", customerId);
        out.put("employeeId", employeeId);

        // names
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

        // email/phone from Customer
        customerRepo.findById(customerId).ifPresent(c -> {
            out.put("email", c.getEmail());
            out.put("homePhone", c.getHomePhone());
        });

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


    @Transactional
    @PutMapping("/address")
    public ResponseEntity<?> updateAddress(
            Principal principal,
            Authentication auth,
            @AuthenticationPrincipal OAuth2User oauthUser,
            @RequestBody AddressUpdateRequest req
    ) {
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

        // update customer basic fields
        Customer c = customerRepo.findById(customerId).orElse(null);
        if (c == null) return ResponseEntity.status(409).body("NEEDS_REGISTRATION");

        if (req.homePhone() != null && !req.homePhone().isBlank()) {
            c.setHomePhone(req.homePhone().trim());
        }
        if (req.email() != null && !req.email().isBlank()) {
            c.setEmail(req.email().trim());
        }

        // only allow changing name if NOT employee
        if (!isEmployee) {
            if (req.firstName() != null && !req.firstName().isBlank()) c.setFirstName(req.firstName().trim());
            if (req.lastName() != null && !req.lastName().isBlank()) c.setLastName(req.lastName().trim());
        }

        customerRepo.save(c);

        // upsert billing address
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


    // ---- Helpers (keep in this controller or share with MeController) ----
    private String resolveLoginKey(Principal principal, Authentication auth, OAuth2User oauthUser) {
        if (auth instanceof OAuth2AuthenticationToken oauthTok) {
            java.util.Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : java.util.Map.of();
            String provider = oauthTok.getAuthorizedClientRegistrationId().toLowerCase();

            String externalId = firstNonBlank(
                    str(attrs.get("sub")),
                    str(attrs.get("id")),
                    str(attrs.get("login"))
            );

            if (externalId != null && !externalId.isBlank()) {
                return (provider + ":" + externalId).toLowerCase();
            }
        }
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

    private String resolveExternalId(String provider, org.springframework.security.oauth2.core.user.OAuth2User oauthUser) {
        if (provider == null || oauthUser == null) return null;
        java.util.Map<String, Object> a = oauthUser.getAttributes();
        return switch (provider) {
            case "google" -> (String) a.get("sub");
            case "github" -> String.valueOf(a.get("id"));
            case "facebook" -> (String) a.get("id");
            default -> null;
        };
    }
}
