package org.example.controller;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.dto.RegisterAsCustomerRequestDTO;
import org.example.dto.SaveMyAddressRequestDTO;
import org.example.model.CustomerAddress;
import org.example.model.Employee;
import org.example.model.UserAccount;
import org.example.repository.CustomerAddressRepository;
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

import org.example.model.Customer;
import org.example.repository.CustomerRepository;
import java.time.LocalDateTime;
import org.example.repository.EmployeeRepository;

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
                        EmployeeRepository employeeRepo
    ) {
        this.userAccountRepo = userAccountRepo;
        this.agentCustomerService = agentCustomerService;
        this.customerAddressRepo = customerAddressRepo;
        this.customerRepo = customerRepo;
        this.employeeRepo = employeeRepo;
    }

    // -------------------- GET /api/me --------------------
    @GetMapping("/api/me")
    public ResponseEntity<?> me(
            Principal principal,
            Authentication auth,
            @AuthenticationPrincipal Object principalObj
    ) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            boolean isOauth = auth instanceof OAuth2AuthenticationToken;

            Map<String, Object> attrs = Map.of();
            OAuth2User oauthUser = null;
            OAuth2AuthenticationToken oauth = null;

            if (isOauth) {
                oauth = (OAuth2AuthenticationToken) auth;
                oauthUser = (OAuth2User) auth.getPrincipal();
                if (oauthUser != null) attrs = oauthUser.getAttributes();
            }


            // ✅ This becomes your "Username" in UserAccounts (use email if possible)
            String key = isOauth ? resolveKey(principal, oauthUser) : principal.getName();


            if (key == null || key.isBlank()) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            // ✅ Find or create UserAccount row
            // ✅ ONLY look up (do NOT auto-create here)
            UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
            if (ua == null) {
                // If they're authenticated but we have no account row, treat as not registered
                return ResponseEntity.status(404).body("Not registered");
            }

// Update last login (optional)
            ua.setLastLoginAt(LocalDateTime.now());
            userAccountRepo.save(ua);


            Map<String, Object> out = new LinkedHashMap<>();
            out.put("name", principal.getName());
            out.put("lookupKey", key);

            out.put("employeeId", ua.getEmployeeId());
            out.put("customerId", ua.getCustomerId());
            out.put("role", ua.getRole());
            out.put("avatarUrl", ua.getAvatarUrl());

            // ✅ If employee, load identity from Employees table
            // ✅ If employee, load first/last from Employees
            if (ua.getEmployeeId() != null) {

                out.put("userType", "Employee"); // always set if employeeId exists

                employeeRepo.findById(ua.getEmployeeId()).ifPresent(emp -> {
                    out.put("firstName", emp.getFirstName());
                    out.put("lastName", emp.getLastName());
                });

                // keep email/phone from Customers (if linked)
                if (ua.getCustomerId() != null) {
                    customerRepo.findById(ua.getCustomerId()).ifPresent(c -> {
                        out.put("email", c.getEmail());
                        out.put("homePhone", c.getHomePhone());
                    });
                }
            }


// ✅ Else if customer, load identity from Customers table
            else if (ua.getCustomerId() != null) {
                customerRepo.findById(ua.getCustomerId()).ifPresent(c -> {
                    out.put("firstName", c.getFirstName());
                    out.put("lastName", c.getLastName());
                    out.put("email", c.getEmail());
                    out.put("homePhone", c.getHomePhone());
                });
            }

            // ✅ attach address if customerId exists
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

            if (isOauth && oauth != null) {
                out.put("provider", oauth.getAuthorizedClientRegistrationId());
                out.put("attributes", attrs);
            }

            return ResponseEntity.ok(out);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error in /api/me: " + e.getMessage());
        }
    }



    // -------------------- POST /api/me/register-as-customer --------------------
    @PostMapping("/api/me/register-as-customer")
    public Object registerAsCustomer(
            Principal principal,
            Authentication auth,
            @AuthenticationPrincipal OAuth2User oauthUser,
            @RequestBody RegisterAsCustomerRequestDTO req
    ) {
        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveKey(principal, oauthUser);

        String provider = null;
        String externalId = null;
        String firstName = null;
        String lastName = null;

        if (auth instanceof OAuth2AuthenticationToken oauth && oauthUser != null) {
            provider = oauth.getAuthorizedClientRegistrationId();
            Map<String, Object> attrs = oauthUser.getAttributes();

            // Google: given_name/family_name/sub
            firstName = str(attrs.get("given_name"));
            lastName  = str(attrs.get("family_name"));
            externalId = str(attrs.get("sub"));

            // fallback: if provider differs
            if (externalId == null) externalId = str(attrs.get("id"));
        }

        return agentCustomerService.registerAsCustomer(key, provider, externalId, firstName, lastName, req);
    }


    // -------------------- POST /api/me/address (first time) --------------------
    @PostMapping("/api/me/address")
    public Object createMyAddress(Principal principal,
                                  OAuth2AuthenticationToken oauth,
                                  @AuthenticationPrincipal OAuth2User oauthUser,
                                  @RequestBody SaveMyAddressRequestDTO req) {

        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveKey(principal, oauthUser);
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        if (ua == null) return ResponseEntity.status(404).body("UserAccount not found");

        if (ua.getCustomerId() == null) {
            return ResponseEntity.status(400).body("No customerId for this user. Register as customer first.");
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
                                  OAuth2AuthenticationToken oauth,
                                  @AuthenticationPrincipal OAuth2User oauthUser,
                                  @RequestBody SaveMyAddressRequestDTO req) {

        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveKey(principal, oauthUser);
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        if (ua == null) return ResponseEntity.status(404).body("UserAccount not found");

        if (ua.getCustomerId() == null) {
            return ResponseEntity.status(400).body("No customerId for this user. Register as customer first.");
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
        return ResponseEntity.ok("Address updated");
    }

    // -------------------- helpers --------------------

    private String resolveKey(Principal principal, OAuth2User oauthUser) {
        Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : Map.of();
        String email = str(attrs.get("email"));
        if (email != null && !email.isBlank()) return email.trim();

        String preferred = str(attrs.get("preferred_username"));
        if (preferred != null && !preferred.isBlank()) return preferred.trim();

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

    @Transactional
    @DeleteMapping("/api/me")
    public ResponseEntity<?> deleteMyProfile(
            Principal principal,
            Authentication auth,
            @AuthenticationPrincipal OAuth2User oauthUser,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = (auth instanceof OAuth2AuthenticationToken)
                ? resolveKey(principal, oauthUser)
                : principal.getName();

        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        if (ua == null) return ResponseEntity.status(404).body("UserAccount not found");

        Integer customerId = ua.getCustomerId();
        Integer employeeId = ua.getEmployeeId();

        if (customerId == null) {
            // log out + invalidate session cookie
            new SecurityContextLogoutHandler().logout(request, response, auth);
            return ResponseEntity.ok("No customer profile to delete");
        }

        if (employeeId != null) {
            // Employee: keep login, unlink customer FIRST to satisfy FK useraccounts -> customers
            ua.setCustomerId(null);
            userAccountRepo.saveAndFlush(ua);   // ✅ flush so FK is cleared in DB now

            // Now safe to delete the customer side
            customerAddressRepo.deleteAllByCustomerId(customerId);
            customerRepo.deleteById(customerId);

            // log out + invalidate session cookie
            new SecurityContextLogoutHandler().logout(request, response, auth);
            return ResponseEntity.ok("Customer profile deleted (employee login kept)");
        }

        // Customer-only: delete dependents, then delete UA (which holds FK), then delete customer
        customerAddressRepo.deleteAllByCustomerId(customerId);
        userAccountRepo.delete(ua);
        userAccountRepo.flush();
        customerRepo.deleteById(customerId);

// ✅ log out + invalidate session cookie
        new SecurityContextLogoutHandler().logout(request, response, auth);

        return ResponseEntity.ok("Account deleted");



    }



}