package org.example.controller;

import java.io.IOException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.example.dto.*;
import org.example.entity.Invoices;
import org.example.model.Customer;
import org.example.model.CustomerAddress;
import org.example.model.Role;
import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.example.service.SubscriptionService;
import org.example.repository.*;
import org.example.service.AgentCustomerService;
import org.example.service.AuditService;
import org.example.service.AvatarStorageService;
import org.example.service.InvoiceService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;


@RestController
public class MeController {

    private final UserAccountRepository userAccountRepo;
    private final AgentCustomerService agentCustomerService;
    private final CustomerAddressRepository customerAddressRepo;
    private final CustomerRepository customerRepo;
    private final EmployeeRepository employeeRepo;
    private final MeRepository meRepository;
    private final AvatarStorageService avatarStorageService;
    private final AuditService auditService;
    private final InvoiceService invoiceService;
    private final RoleRepository roleRepository;
    private final UserAccountRepository userAccountRepository;
    private final SubscriptionService subscriptionService;

    public MeController(UserAccountRepository userAccountRepo,
                        AgentCustomerService agentCustomerService,
                        CustomerAddressRepository customerAddressRepo,
                        CustomerRepository customerRepo,
                        EmployeeRepository employeeRepo,
                        MeRepository meRepository,
                        AvatarStorageService avatarStorageService,
                        AuditService auditService,
                        InvoiceService invoiceService,
                        RoleRepository roleRepository,
                        UserAccountRepository userAccountRepository,
                        SubscriptionService subscriptionService) {
        this.userAccountRepo = userAccountRepo;
        this.agentCustomerService = agentCustomerService;
        this.customerAddressRepo = customerAddressRepo;
        this.customerRepo = customerRepo;
        this.employeeRepo = employeeRepo;
        this.meRepository = meRepository;
        this.avatarStorageService = avatarStorageService;
        this.auditService = auditService;
        this.invoiceService = invoiceService;
        this.roleRepository = roleRepository;
        this.userAccountRepository = userAccountRepository;
        this.subscriptionService = subscriptionService;
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
            String key = resolveLoginKey(principal, auth, oauthUser);

            if (key == null || key.isBlank()) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);

            // Auto-register OAuth users if UA missing
            if (ua == null && isOauth && oauthTok != null) {
                String provider = oauthTok.getAuthorizedClientRegistrationId().toLowerCase();
                String externalId = firstNonBlank(
                        str(attrs.get("sub")),
                        str(attrs.get("id")),
                        str(attrs.get("login"))
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

                Customer customer = customerRepo
                        .findByExternalProviderAndExternalCustomerId(provider, externalId)
                        .orElseGet(() -> {
                            String fullName = firstNonBlank(str(attrs.get("name")), str(attrs.get("login")));
                            String firstName = firstNonBlank(str(attrs.get("given_name")), str(attrs.get("first_name")),
                                    fullName != null ? fullName.split(" ")[0] : "—");
                            String lastName = firstNonBlank(str(attrs.get("family_name")), str(attrs.get("last_name")),
                                    fullName != null ? fullName.replaceFirst("^\\S+\\s*", "") : "");

                            Customer c = new Customer();
                            c.setCustomerType("Individual");
                            c.setFirstName(firstName);
                            c.setLastName(lastName);
                            c.setEmail(normalizedEmail);
                            c.setExternalProvider(provider);
                            c.setExternalCustomerId(externalId);
                            c.setStatus("Active");
                            c.setCreatedAt(LocalDateTime.now());
                            c.setPasswordHash("OAUTH:" + provider);
                            return customerRepo.save(c);
                        });

                UserAccount newUa = new UserAccount();
                newUa.setUsername(key);
//                newUa.setRole("Customer");
                Role customerRole = roleRepository.findByRoleName("Customer")
                        .orElseThrow(() -> new RuntimeException("Customer role not found"));

                newUa.setRole(customerRole);
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

            String oauthPictureUrl = isOauth ? extractOAuthPictureUrl(attrs) : null;
            if (isOauth && ua != null && (ua.getAvatarUrl() == null || ua.getAvatarUrl().isBlank())) {
                String provider = oauthTok != null ? oauthTok.getAuthorizedClientRegistrationId().toLowerCase() : null;
                try {
                    avatarStorageService.importOAuthAvatarForUser(ua, oauthPictureUrl, provider);
                    ua = userAccountRepo.findById(ua.getUserId()).orElse(ua);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            // Build response
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("name", principal.getName());
            out.put("lookupKey", key);
            out.put("employeeId", ua.getEmployeeId());
            out.put("customerId", ua.getCustomerId());
            out.put("role", ua.getEmployeeId() != null ? "EMPLOYEE" :
                    ua.getCustomerId() != null ? "CUSTOMER" : "GUEST");
            out.put("uaRole", ua.getRole());
            out.put("avatarUrl", ua.getAvatarUrl());

            if (ua.getCustomerId() != null) {
                out.put("userType", "CUSTOMER");
                customerRepo.findById(ua.getCustomerId()).ifPresent(c -> {
                    out.put("firstName", c.getFirstName());
                    out.put("lastName", c.getLastName());
                    out.put("email", c.getEmail());
                    out.put("phone", c.getHomePhone());
                });
            } else if (ua.getEmployeeId() != null) {
                out.put("userType", "EMPLOYEE");
                employeeRepo.findById(ua.getEmployeeId()).ifPresent(emp -> {
                    out.put("firstName", emp.getFirstName());
                    out.put("lastName", emp.getLastName());
                    out.put("email", emp.getEmail());
                    out.put("phone", emp.getPhone());
                });
            } else {
                out.put("userType", "Unknown");
            }

            if (ua.getCustomerId() != null) {
                customerAddressRepo
                        .findFirstByCustomerIdOrderByIsPrimaryDesc(ua.getCustomerId())
                        .ifPresentOrElse(addr -> out.put("address", addressToMap(addr)),
                                () -> out.put("address", null));
            } else {
                out.put("address", null);
            }

            if (isOauth && oauthTok != null) {
                out.put("provider", oauthTok.getAuthorizedClientRegistrationId().toLowerCase());
                out.put("attributes", attrs);
                out.put("oauthPicture", oauthPictureUrl);
            }

            return ResponseEntity.ok(out);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error in /api/me: " + e.getMessage());
        }
    }

    @PutMapping("/api/me/profile")
    @Transactional
    public ResponseEntity<?> updateMyProfile(Principal principal,
                                             Authentication auth,
                                             @AuthenticationPrincipal OAuth2User oauthUser,
                                             @RequestBody UpdateMyProfileDTO req) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            String key = resolveLoginKey(principal, auth, oauthUser);
            UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);

            if (ua == null || ua.getCustomerId() == null) {
                return ResponseEntity.status(404).body("Customer profile not found");
            }

            Customer c = customerRepo.findById(ua.getCustomerId()).orElse(null);
            if (c == null) {
                return ResponseEntity.status(404).body("Customer not found");
            }

            c.setFirstName(req.getFirstName());
            c.setLastName(req.getLastName());
            c.setEmail(req.getEmail());
            c.setHomePhone(req.getHomePhone());

            customerRepo.save(c);

            return ResponseEntity.ok("Profile updated successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to update profile: " + e.getMessage());
        }
    }

    // -------------------- GET /api/me/invoice/latest --------------------
    @GetMapping("/api/me/invoice/latest")
    public ResponseEntity<?> getMyLatestInvoice(Principal principal,
                                                Authentication auth,
                                                @AuthenticationPrincipal OAuth2User oauthUser) {
        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveLoginKey(principal, auth, oauthUser);
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        if (ua == null || ua.getCustomerId() == null) {
            return ResponseEntity.status(404).body("UserAccount or customerId not found");
        }

        Integer customerId = ua.getCustomerId();
        Invoices latestInvoice = invoiceService.findLatestByCustomerId(customerId);
        if (latestInvoice == null) {
            return ResponseEntity.noContent().build();
        }

        InvoiceDTO dto = invoiceService.convertToDTO(latestInvoice);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("invoice", dto);

        return ResponseEntity.ok(out);
    }

    // -------------------- Helpers --------------------
    private String resolveLoginKey(Principal principal, Authentication auth, OAuth2User oauthUser) {
        if (auth instanceof OAuth2AuthenticationToken oauthTok) {
            Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : Map.of();
            String provider = oauthTok.getAuthorizedClientRegistrationId().toLowerCase();

            String externalId = firstNonBlank(str(attrs.get("sub")), str(attrs.get("id")), str(attrs.get("login")));
            if (externalId != null && !externalId.isBlank()) {
                return (provider + ":" + externalId).toLowerCase();
            }
        }
        return principal.getName();
    }

    private Map<String, Object> addressToMap(CustomerAddress addr) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("street1", addr.getStreet1());
        map.put("street2", addr.getStreet2());
        map.put("city", addr.getCity());
        map.put("province", addr.getProvince());
        map.put("postalCode", addr.getPostalCode());
        map.put("country", addr.getCountry());
        map.put("addressType", addr.getAddressType());
        map.put("isPrimary", addr.getIsPrimary());
        return map;
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

    private static String extractOAuthPictureUrl(Map<String, Object> attrs) {
        Object gh = attrs.get("avatar_url");
        if (gh != null && !gh.toString().isBlank()) return gh.toString();
        Object pic = attrs.get("picture");
        if (pic instanceof String s && !s.isBlank()) return s.trim();
        if (pic instanceof Map<?, ?> picMap) {
            Object data = picMap.get("data");
            if (data instanceof Map<?, ?> dataMap) {
                Object url = dataMap.get("url");
                if (url != null && !url.toString().isBlank()) return url.toString();
            }
            Object url = picMap.get("url");
            if (url != null && !url.toString().isBlank()) return url.toString();
        }
        return null;
    }

    @PostMapping("/api/me/register-as-customer")
    @Transactional
    public ResponseEntity<?> registerAsCustomer(Principal principal,
                                                Authentication auth,
                                                @AuthenticationPrincipal OAuth2User oauthUser,
                                                @RequestBody RegisterAsCustomerRequestDTO req) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            String key = resolveLoginKey(principal, auth, oauthUser);
            UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);

            if (ua == null) {
                return ResponseEntity.status(404).body("UserAccount not found");
            }

            if (ua.getCustomerId() != null) {
                return ResponseEntity.status(409).body("User is already registered as a customer");
            }

            if (ua.getEmployeeId() == null) {
                return ResponseEntity.status(400).body("Only employees can use this registration flow");
            }

            var empOpt = employeeRepo.findById(ua.getEmployeeId());
            if (empOpt.isEmpty()) {
                return ResponseEntity.status(404).body("Employee not found");
            }

            var emp = empOpt.get();

            Customer c = new Customer();
            c.setCustomerType("Individual");
            c.setFirstName(firstNonBlank(req.getFirstName(), emp.getFirstName()));
            c.setLastName(firstNonBlank(req.getLastName(), emp.getLastName()));
            c.setEmail(firstNonBlank(req.getEmail(), emp.getEmail()));
            c.setHomePhone(firstNonBlank(req.getHomePhone(), emp.getPhone()));
            c.setStatus("Active");
            c.setCreatedAt(LocalDateTime.now());
            c.setPasswordHash("LINKED_EMPLOYEE");

            Customer savedCustomer = customerRepo.save(c);

            ua.setCustomerId(savedCustomer.getCustomerId());
            userAccountRepo.save(ua);

            if (req.getStreet1() != null && !req.getStreet1().isBlank()) {
                CustomerAddress addr = new CustomerAddress();
                addr.setCustomerId(savedCustomer.getCustomerId());
                addr.setStreet1(req.getStreet1());
                addr.setStreet2(req.getStreet2());
                addr.setCity(req.getCity());
                addr.setProvince(req.getProvince());
                addr.setPostalCode(req.getPostalCode());
                addr.setCountry(req.getCountry());
                addr.setAddressType("Billing");
                addr.setIsPrimary(1);
                customerAddressRepo.save(addr);
            }

            Map<String, Object> out = new LinkedHashMap<>();
            out.put("message", "Customer profile created successfully");
            out.put("customerId", savedCustomer.getCustomerId());
            out.put("employeeId", ua.getEmployeeId());

            return ResponseEntity.ok(out);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to register as customer: " + e.getMessage());
        }
    }

//    for workshop06 finding the plans for customer
@GetMapping("/api/me/current-plan")
public ResponseEntity<?> getCurrentPlan(Authentication authentication) {
    String loginKey = authentication.getName();

    UserAccount ua = userAccountRepository.findByUsername(loginKey).orElse(null);

    if (ua == null) {
        return ResponseEntity.status(404).body("User not found");
    }

    Integer customerId = ua.getCustomerId();

    if (customerId == null) {
        return ResponseEntity.status(404).body("No customer linked to this user");
    }

    CurrentPlanResponseDTO plan = subscriptionService.getCurrentPlan(customerId);

    if (plan == null) {
        return ResponseEntity.status(404).body("No active plan");
    }

    return ResponseEntity.ok(plan);
}

}