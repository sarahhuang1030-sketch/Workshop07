package org.example.controller;

import org.example.model.Customer;
import org.example.model.CustomerAddress;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.UserAccountRepository;
import org.example.repository.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;


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
    public ResponseEntity<?> getBillingAddress(
            Principal principal,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            org.springframework.security.oauth2.core.user.OAuth2User oauthUser
    ) {
        try {
            if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

            String key = resolveKey(principal, oauthUser);
            if (key == null || key.isBlank()) return ResponseEntity.status(401).body("Not authenticated");

//            var uaOpt = userAccountRepo.findByUsernameIgnoreCase(key);
//            if (uaOpt.isEmpty()) return ResponseEntity.status(404).body("UserAccount not found");

            var ua = userAccountRepo.findByUsernameIgnoreCase(key).orElseGet(() -> {
                var nua = new org.example.model.UserAccount();
                nua.setUsername(key);
                nua.setRole("Customer");
                nua.setPasswordHash("OAUTH");
                nua.setIsLocked(0);
                return userAccountRepo.save(nua);
            });


           // var ua = uaOpt.get();
            Integer customerId = ua.getCustomerId();
            Integer employeeId = ua.getEmployeeId();

            var out = new LinkedHashMap<String, Object>();
            out.put("customerId", customerId);
            out.put("employeeId", employeeId);

            // ✅ If employee: first/last from Employee table
            if (employeeId != null) {
                employeeRepo.findById(employeeId).ifPresent(emp -> {
                    out.put("firstName", emp.getFirstName());
                    out.put("lastName", emp.getLastName());
                });
            }

// ✅ Email/phone still from Customer table (if linked)
            if (customerId != null) {
                Customer c = customerRepo.findById(customerId).orElse(null);
                if (c != null) {
                    out.put("email", c.getEmail());
                    out.put("homePhone", c.getHomePhone());
                }

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
            }


            return ResponseEntity.ok(out);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to load billing info");
        }
    }


    @Transactional
    @PutMapping("/address")
    public ResponseEntity<?> updateAddress(
            Principal principal,
            org.springframework.security.core.Authentication auth,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            org.springframework.security.oauth2.core.user.OAuth2User oauthUser,
            @RequestBody AddressUpdateRequest req
    ) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            // ---- Resolve login key (prefer email) ----
            String key = resolveKey(principal, oauthUser);
            if (key == null || key.isBlank()) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            // ---- Load or create UserAccount (important: your logs show null right now) ----
            var ua = userAccountRepo.findByUsernameIgnoreCase(key).orElseGet(() -> {
                var nua = new org.example.model.UserAccount(); // adjust package/type if needed
                nua.setUsername(key);
                nua.setRole("Customer");
                nua.setPasswordHash("OAUTH");   // since this is OAuth login
                nua.setIsLocked(0);
                return userAccountRepo.save(nua);
            });

            boolean isEmployee = ua.getEmployeeId() != null;
            Integer employeeId = ua.getEmployeeId();


            Integer customerId = ua.getCustomerId();

            // ---- Pull OAuth identity bits (email/first/last/provider/externalId) ----
            String provider = null;
            String externalId = null;

            String email = null;
            String firstName = null;
            String lastName = null;

            if (auth instanceof org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken oauth
                    && oauthUser != null) {

                provider = oauth.getAuthorizedClientRegistrationId();
                var attrs = oauthUser.getAttributes();

                email = attrs.get("email") != null ? attrs.get("email").toString() : null;
                firstName = attrs.get("given_name") != null ? attrs.get("given_name").toString() : null;
                lastName = attrs.get("family_name") != null ? attrs.get("family_name").toString() : null;

                externalId = switch (provider) {
                    case "google" -> attrs.get("sub") != null ? attrs.get("sub").toString() : null;
                    case "github" -> attrs.get("id") != null ? String.valueOf(attrs.get("id")) : null;
                    case "facebook" -> attrs.get("id") != null ? attrs.get("id").toString() : null;
                    default -> null;
                };
            }

            // Fallbacks (non-oauth or missing email)
            if (email == null || email.isBlank()) email = key; // key is usually email for oauth
            if (firstName == null) firstName = "";
            if (lastName == null) lastName = "";

            // ---- If no customer yet, find or create Customer ----
            if (customerId == null) {
                Customer c = null;

                // 1) Prefer OAuth dedupe (provider + externalId)
                if (provider != null && externalId != null) {
                    var found = customerRepo.findByExternalProviderAndExternalCustomerId(provider, externalId);
                    if (found.isPresent()) c = found.get();
                }

                // 2) Otherwise dedupe by email
                if (c == null) {
                    var foundByEmail = customerRepo.findFirstByEmailIgnoreCase(email);
                    if (foundByEmail.isPresent()) c = foundByEmail.get();
                }

                // 3) Create new customer
                if (c == null) {
                    c = new Customer();
                    c.setCustomerType("Individual");
                    c.setEmail(email);

                    // store name in Customers
                    c.setFirstName(firstName);
                    c.setLastName(lastName);

                    // phone: take from request if you add it; otherwise fallback
                    String phone = (req.homePhone() == null || req.homePhone().isBlank()) ? "0000000000" : req.homePhone().trim();
                    c.setHomePhone(phone);

                    // store oauth linkage in Customers too (recommended)
                    if (provider != null && externalId != null) {
                        c.setExternalProvider(provider);
                        c.setExternalCustomerId(externalId);
                    }

                    c.setPasswordHash("OAUTH");
                    c = customerRepo.save(c);
                }

                customerId = c.getCustomerId();
                ua.setCustomerId(customerId);
                userAccountRepo.save(ua);
            }

            final Integer finalCustomerId = customerId;

            Customer existing = customerRepo.findById(finalCustomerId).orElse(null);
            if (existing != null) {

                if (req.homePhone() != null && !req.homePhone().isBlank()) {
                    existing.setHomePhone(req.homePhone().trim());
                }

                // ✅ Only update customer name if NOT an employee
                if (!isEmployee) {
                    if (req.firstName() != null && !req.firstName().isBlank()) {
                        existing.setFirstName(req.firstName().trim());
                    }
                    if (req.lastName() != null && !req.lastName().isBlank()) {
                        existing.setLastName(req.lastName().trim());
                    }
                }

                if (req.email() != null && !req.email().isBlank()) {
                    existing.setEmail(req.email().trim());
                }

                customerRepo.save(existing);
            }



            // ---- Upsert BILLING address ----
            var addr = customerAddressRepo
                    .findFirstByCustomerIdAndAddressTypeOrderByIsPrimaryDesc(finalCustomerId, "Billing")
                    .orElseGet(() -> {
                        var a = new CustomerAddress();
                        a.setCustomerId(finalCustomerId);
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
            out.put("customerId", finalCustomerId);
            out.put("homePhone", req.homePhone() != null ? req.homePhone().trim() : null);
            if (isEmployee && employeeId != null) {
                employeeRepo.findById(employeeId).ifPresent(emp -> {
                    out.put("firstName", emp.getFirstName());
                    out.put("lastName", emp.getLastName());
                });
            } else {
                out.put("firstName", existing != null ? existing.getFirstName() : null);
                out.put("lastName", existing != null ? existing.getLastName() : null);
            }

            out.put("email", existing != null ? existing.getEmail() : null);
            return ResponseEntity.ok(out);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to update billing address");
        }
    }


    // ---- Helpers (keep in this controller or share with MeController) ----
    private String resolveKey(Principal principal, org.springframework.security.oauth2.core.user.OAuth2User oauthUser) {
        java.util.Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : java.util.Map.of();

        Object email = attrs.get("email");
        if (email != null && !email.toString().isBlank()) return email.toString().trim();

        Object preferred = attrs.get("preferred_username");
        if (preferred != null && !preferred.toString().isBlank()) return preferred.toString().trim();

        Object login = attrs.get("login"); // github username sometimes
        if (login != null && !login.toString().isBlank()) return login.toString().trim();

        return principal.getName();
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
