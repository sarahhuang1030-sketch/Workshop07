package org.example.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.example.dto.RegisterAsCustomerRequestDTO;
import org.example.dto.SaveMyAddressRequestDTO;
import org.example.model.Customer;
import org.example.model.CustomerAddress;
import org.example.model.UserAccount;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.EmployeeRepository;
import org.example.repository.UserAccountRepository;
import org.example.service.AgentCustomerService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;

@RestController
public class MeController {

    private final UserAccountRepository userAccountRepo;
    private final AgentCustomerService agentCustomerService;
    private final CustomerAddressRepository customerAddressRepo;
    private final CustomerRepository customerRepo;
    private final EmployeeRepository employeeRepo;

    public MeController(UserAccountRepository userAccountRepo,
                        AgentCustomerService agentCustomerService,
                        CustomerAddressRepository customerAddressRepo,
                        CustomerRepository customerRepo,
                        EmployeeRepository employeeRepo) {
        this.userAccountRepo = userAccountRepo;
        this.agentCustomerService = agentCustomerService;
        this.customerAddressRepo = customerAddressRepo;
        this.customerRepo = customerRepo;
        this.employeeRepo = employeeRepo;
    }

    // -------------------- GET /api/me --------------------
    @GetMapping("/api/me")
    public ResponseEntity<?> me(Principal principal,
                                Authentication auth,
                                @AuthenticationPrincipal OAuth2User oauthUser) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            boolean isOauth = auth instanceof OAuth2AuthenticationToken;
            OAuth2AuthenticationToken oauthTok = isOauth ? (OAuth2AuthenticationToken) auth : null;

            Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : Map.of();

            // OAuth => provider:externalId ; local => principal.getName()
            String key = resolveLoginKey(principal, auth, oauthUser);
            if (key == null || key.isBlank()) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);

            // Auto-register OAuth users if UA missing
            if (ua == null) {
                if (!isOauth || oauthTok == null) {
                    return ResponseEntity.status(404).body("Not registered");
                }

                String provider = oauthTok.getAuthorizedClientRegistrationId().toLowerCase();

                String externalId = firstNonBlank(
                        str(attrs.get("sub")),    // Google/Entra
                        str(attrs.get("id")),     // Facebook sometimes
                        str(attrs.get("login"))   // GitHub
                );
                if (externalId == null || externalId.isBlank()) {
                    return ResponseEntity.status(400).body("OAuth externalId missing");
                }

                String rawEmail = firstNonBlank(
                        str(attrs.get("email")),
                        str(attrs.get("preferred_username")),
                        str(attrs.get("upn"))
                );
                final String normalizedEmail = rawEmail != null ? rawEmail.trim().toLowerCase() : null;

                // 1) Find or create Customer by (provider, externalId)
                Customer customer = customerRepo
                        .findByExternalProviderAndExternalCustomerId(provider, externalId)
                        .orElse(null);

                if (customer == null) {
                    String fullName = firstNonBlank(str(attrs.get("name")), str(attrs.get("login")));

                    String firstName = firstNonBlank(
                            str(attrs.get("given_name")),
                            str(attrs.get("first_name")),
                            (fullName != null ? fullName.split(" ")[0] : null),
                            "—"
                    );

                    String lastName = firstNonBlank(
                            str(attrs.get("family_name")),
                            str(attrs.get("last_name")),
                            (fullName != null ? fullName.replaceFirst("^\\S+\\s*", "") : null),
                            ""
                    );

                    Customer c = new Customer();
                    c.setCustomerType("Individual");
                    c.setFirstName(firstName);
                    c.setLastName(lastName);
                    c.setEmail(normalizedEmail); // can be null (GitHub etc.)
                    c.setHomePhone(null);
                    c.setExternalProvider(provider);
                    c.setExternalCustomerId(externalId);
                    c.setStatus("Active");
                    c.setCreatedAt(LocalDateTime.now());
                    c.setPasswordHash("OAUTH:" + provider);

                    customer = customerRepo.save(c);
                }

                // 2) Create UA for this key, linked to that customer
                UserAccount newUa = new UserAccount();
                newUa.setUsername(key);
                newUa.setRole("Customer");
                newUa.setCustomerId(customer.getCustomerId());
                newUa.setEmployeeId(null);
                newUa.setIsLocked(0);
                newUa.setPasswordHash("OAUTH:" + provider);
                newUa.setLastLoginAt(LocalDateTime.now());

                ua = userAccountRepo.save(newUa);
            }

            // Update last login
            ua.setLastLoginAt(LocalDateTime.now());
            userAccountRepo.save(ua);

            // Build response
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("name", principal.getName());
            out.put("lookupKey", key);

            out.put("employeeId", ua.getEmployeeId());
            out.put("customerId", ua.getCustomerId());
            out.put("role", ua.getRole());
            out.put("avatarUrl", ua.getAvatarUrl());

            // Employee
            if (ua.getEmployeeId() != null) {
                out.put("userType", "Employee");

                employeeRepo.findById(ua.getEmployeeId()).ifPresent(emp -> {
                    out.put("firstName", emp.getFirstName());
                    out.put("lastName", emp.getLastName());
                });

                if (ua.getCustomerId() != null) {
                    customerRepo.findById(ua.getCustomerId()).ifPresent(c -> {
                        out.put("email", c.getEmail());
                        out.put("homePhone", c.getHomePhone());
                    });
                }
            }
            // Customer
            else if (ua.getCustomerId() != null) {
                out.put("userType", "Customer");
                customerRepo.findById(ua.getCustomerId()).ifPresent(c -> {
                    out.put("firstName", c.getFirstName());
                    out.put("lastName", c.getLastName());
                    out.put("email", c.getEmail());
                    out.put("homePhone", c.getHomePhone());
                });
            } else {
                out.put("userType", "Unknown");
            }

            // Address (if customerId exists)
            if (ua.getCustomerId() != null) {
                customerAddressRepo
                        .findFirstByCustomerIdOrderByIsPrimaryDesc(ua.getCustomerId())
                        .ifPresentOrElse(
                                addr -> out.put("address", addressToMap(addr)),
                                () -> out.put("address", null)
                        );
            } else {
                out.put("address", null);
            }

            if (isOauth && oauthTok != null) {
                out.put("provider", oauthTok.getAuthorizedClientRegistrationId().toLowerCase());
                out.put("attributes", attrs);

                out.put("oauthPicture", firstNonBlank(
                        str(attrs.get("picture")),      // google
                        str(attrs.get("avatar_url")),   // github
                        str(attrs.get("picture"))
                ));
            }

            return ResponseEntity.ok(out);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error in /api/me: " + e.getMessage());
        }
    }

//    @GetMapping("/api/me")
//    @Transactional(readOnly = true)
//    public ResponseEntity<?> me(Principal principal,
//                                Authentication auth,
//                                @AuthenticationPrincipal OAuth2User oauthUser){
//
//        String email = oauthUser.getAttribute("email");
//
//        String key = resolveLoginKey(principal, auth, oauthUser);
//        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElseThrow();
//
//        Customer c = customerRepo.findFirstByEmailIgnoreCase(email)
//                .orElseThrow(() -> new RuntimeException("Customer not found"));
//
//        CustomerAddress addr = customerAddressRepo
//                .findFirstByCustomerIdOrderByIsPrimaryDesc(c.getCustomerId())
//                .orElse(null);
//
//        Map<String, Object> out = new HashMap<>();
//
//        // Personal section
//        Map<String, Object> personal = new HashMap<>();
//        personal.put("firstName", c.getFirstName());
//        personal.put("lastName", c.getLastName());
//        personal.put("email", c.getEmail());
//        personal.put("phone", c.getHomePhone());
//
//        // Billing section
//        Map<String, Object> billing = new HashMap<>();
//
//        if (addr != null) {
//            Map<String, Object> address = new HashMap<>();
//            address.put("street1", addr.getStreet1());
//            address.put("street2", addr.getStreet2());
//            address.put("city", addr.getCity());
//            address.put("province", addr.getProvince());
//            address.put("postalCode", addr.getPostalCode());
//            address.put("country", addr.getCountry());
//            billing.put("address", address);
//        } else {
//            billing.put("address", null);
//        }
//
//        billing.put("nextBillAmount", 29.99);
//        billing.put("nextBillDate", "2026-03-15");
//        billing.put("paymentMethod", "Visa **** 1234");
//
//        out.put("id", c.getCustomerId());
//        out.put("personal", personal);
//        out.put("billing", billing);
//
//        return ResponseEntity.ok(out);
//    }

    // -------------------- POST /api/me/register-as-customer --------------------
    @PostMapping("/api/me/register-as-customer")
    public Object registerAsCustomer(Principal principal,
                                     Authentication auth,
                                     @AuthenticationPrincipal OAuth2User oauthUser,
                                     @RequestBody RegisterAsCustomerRequestDTO req) {

        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        Map<String, Object> attrs = (oauthUser != null) ? oauthUser.getAttributes() : Map.of();

        String provider = null;
        if (auth instanceof OAuth2AuthenticationToken oauth) {
            provider = oauth.getAuthorizedClientRegistrationId().toLowerCase();
        }

        String rawEmail = firstNonBlank(
                str(attrs.get("email")),
                str(attrs.get("preferred_username")),
                str(attrs.get("upn"))
        );
        String email = rawEmail != null ? rawEmail.trim().toLowerCase() : null;

        String key = resolveLoginKey(principal, auth, oauthUser);

        if ((email == null || email.isBlank()) && req != null) {
            String reqEmail = req.email != null ? req.email.trim().toLowerCase() : null;
            email = firstNonBlank(reqEmail);
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("OAuth email is missing. Please re-login with OAuth.");
        }

        if (req != null && (req.email == null || req.email.isBlank())) {
            req.email = email;
        }

        String externalId = firstNonBlank(
                str(attrs.get("sub")),
                str(attrs.get("id")),
                str(attrs.get("login"))
        );

        String firstName = firstNonBlank(
                str(attrs.get("given_name")),
                str(attrs.get("first_name"))
        );

        String lastName = firstNonBlank(
                str(attrs.get("family_name")),
                str(attrs.get("last_name"))
        );

        return agentCustomerService.registerAsCustomer(key, provider, externalId, firstName, lastName, req);
    }

    // -------------------- POST /api/me/address (first time) --------------------
    @PostMapping("/api/me/address")
    public Object createMyAddress(Principal principal,
                                  Authentication auth,
                                  @AuthenticationPrincipal OAuth2User oauthUser,
                                  @RequestBody SaveMyAddressRequestDTO req) {

        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveLoginKey(principal, auth, oauthUser);

        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        if (ua == null) return ResponseEntity.status(404).body("UserAccount not found");

        if (ua.getCustomerId() == null) {
            return ResponseEntity.status(400).body("No customerId for this user.");
        }

        var existing = customerAddressRepo.findFirstByCustomerIdOrderByIsPrimaryDesc(ua.getCustomerId());
        if (existing.isPresent()) {
            return ResponseEntity.status(409).body("Address already exists. Use PUT /api/me/address to update.");
        }

        CustomerAddress addr = new CustomerAddress();
        addr.setCustomerId(ua.getCustomerId());
        addr.setAddressType(firstNonBlank(req.addressType, "Billing"));
        addr.setIsPrimary(1);

        addr.setStreet1(req.street1);
        addr.setStreet2(req.street2);
        addr.setCity(req.city);
        addr.setProvince(req.province);
        addr.setPostalCode(req.postalCode);
        addr.setCountry(req.country);

        customerAddressRepo.save(addr);
        return ResponseEntity.ok("Address saved");
    }

    // -------------------- PUT /api/me/address (edit later) --------------------
    @PutMapping("/api/me/address")
    public Object updateMyAddress(Principal principal,
                                  Authentication auth,
                                  @AuthenticationPrincipal OAuth2User oauthUser,
                                  @RequestBody SaveMyAddressRequestDTO req) {

        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveLoginKey(principal, auth, oauthUser);

        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        if (ua == null) return ResponseEntity.status(404).body("UserAccount not found");

        if (ua.getCustomerId() == null) {
            return ResponseEntity.status(400).body("No customerId for this user.");
        }

        CustomerAddress addr = customerAddressRepo
                .findFirstByCustomerIdOrderByIsPrimaryDesc(ua.getCustomerId())
                .orElseGet(() -> {
                    CustomerAddress a = new CustomerAddress();
                    a.setCustomerId(ua.getCustomerId());
                    a.setIsPrimary(1);
                    a.setAddressType(firstNonBlank(req.addressType, "Billing"));
                    return a;
                });

        addr.setIsPrimary(1);
        addr.setAddressType(firstNonBlank(req.addressType, addr.getAddressType()));

        addr.setStreet1(req.street1);
        addr.setStreet2(req.street2);
        addr.setCity(req.city);
        addr.setProvince(req.province);
        addr.setPostalCode(req.postalCode);
        addr.setCountry(req.country);

        customerAddressRepo.save(addr);
//        return ResponseEntity.ok("Address updated");
        Map<String, String> response = new HashMap<>();
        response.put("message", "Address updated");
        return ResponseEntity.ok(response);
    }

    // -------------------- DELETE /api/me --------------------
    @Transactional
    @DeleteMapping("/api/me")
    public ResponseEntity<?> deleteMyProfile(Principal principal,
                                             Authentication auth,
                                             @AuthenticationPrincipal OAuth2User oauthUser,
                                             HttpServletRequest request,
                                             HttpServletResponse response) {

        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveLoginKey(principal, auth, oauthUser);

        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        if (ua == null) return ResponseEntity.status(404).body("UserAccount not found");

        Integer customerId = ua.getCustomerId();
        Integer employeeId = ua.getEmployeeId();

        if (customerId == null) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
            return ResponseEntity.ok("No customer profile to delete");
        }

        if (employeeId != null) {
            ua.setCustomerId(null);
            userAccountRepo.saveAndFlush(ua);

            customerAddressRepo.deleteAllByCustomerId(customerId);
            customerRepo.deleteById(customerId);

            new SecurityContextLogoutHandler().logout(request, response, auth);
            return ResponseEntity.ok("Customer profile deleted (employee login kept)");
        }

        customerAddressRepo.deleteAllByCustomerId(customerId);
        userAccountRepo.delete(ua);
        userAccountRepo.flush();
        customerRepo.deleteById(customerId);

        new SecurityContextLogoutHandler().logout(request, response, auth);
        return ResponseEntity.ok("Account deleted");
    }

    // -------------------- helpers --------------------

    // OAuth => provider:externalId ; local login => principal.getName()
    private String resolveLoginKey(Principal principal, Authentication auth, OAuth2User oauthUser) {
        if (auth instanceof OAuth2AuthenticationToken oauthTok) {
            Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : Map.of();
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

    private Map<String, Object> addressToMap(CustomerAddress addr) {
        Map<String, Object> address = new LinkedHashMap<>();
        address.put("street1", addr.getStreet1());
        address.put("street2", addr.getStreet2());
        address.put("city", addr.getCity());
        address.put("province", addr.getProvince());
        address.put("postalCode", addr.getPostalCode());
        address.put("country", addr.getCountry());
        address.put("addressType", addr.getAddressType());
        address.put("isPrimary", addr.getIsPrimary());
        return address;
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