package org.example.controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
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
import org.example.repository.*;
import org.example.service.*;

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
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionAddOnRepository subscriptionAddOnRepository;
    private final LocationRepository locationRepo;
    private final PaymentRepository paymentRepository;
    private final PlanRepository planRepository;
    private final AddOnRepository addOnRepository;

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
                        SubscriptionService subscriptionService,
                        SubscriptionRepository subscriptionRepository,
                        SubscriptionAddOnRepository subscriptionAddOnRepository,
                        LocationRepository locationRepo,
                        PaymentRepository paymentRepository,
                        PlanRepository planRepository,
                        AddOnRepository addOnRepository) {
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
        this.subscriptionService = subscriptionService;
        this.userAccountRepository = userAccountRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.subscriptionAddOnRepository = subscriptionAddOnRepository;
        this.locationRepo = locationRepo;
        this.paymentRepository = paymentRepository;
        this.planRepository = planRepository;
        this.addOnRepository = addOnRepository;
    }

    // -------------------- GET /api/me --------------------
    @GetMapping("/api/me")
    public ResponseEntity<?> me(Principal principal,
                                Authentication auth,
                                @AuthenticationPrincipal OAuth2User oauthUser) {
        try {
            System.out.println("Principal: " + principal);
            System.out.println("Auth: " + auth);
            System.out.println("Auth name: " + (auth != null ? auth.getName() : null));
            System.out.println("Authorities: " + (auth != null ? auth.getAuthorities() : null));

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
            out.put("avatarUrl",
                    ua.getAvatarUrl() != null && !ua.getAvatarUrl().isBlank()
                            ? ua.getAvatarUrl()
                            : "/uploads/avatars/default.jpg");
            out.put("points", ua.getPoints());

            if (ua.getEmployeeId() != null) {
                out.put("userType", "EMPLOYEE");
                out.put("username", ua.getUsername());

                employeeRepo.findById(ua.getEmployeeId()).ifPresent(emp -> {
                    out.put("firstName", emp.getFirstName());
                    out.put("lastName", emp.getLastName());
                    out.put("email", emp.getEmail());
                    out.put("phone", emp.getPhone());

                    out.put("primaryLocationId", emp.getPrimaryLocationId());
                    out.put("status", emp.getStatus());
                    out.put("employeeActive", emp.getActive() != null && emp.getActive() == 1);
                    out.put("hireDate", emp.getHireDate());
                    out.put("managerId", emp.getManagerId());

                    String locationName = null;
                    if (emp.getPrimaryLocationId() != null) {
                        locationName = locationRepo.findById(emp.getPrimaryLocationId())
                                .map(loc -> loc.getLocationName())
                                .orElse(null);
                    }
                    out.put("locationName", locationName);
                });

                // Optional: still include customer info too if linked
                if (ua.getCustomerId() != null) {
                    customerRepo.findById(ua.getCustomerId()).ifPresent(c -> {
                        out.putIfAbsent("customerFirstName", c.getFirstName());
                        out.putIfAbsent("customerLastName", c.getLastName());
                        out.putIfAbsent("customerEmail", c.getEmail());
                        out.putIfAbsent("customerPhone", c.getHomePhone());
                    });
                }
            } else if (ua.getCustomerId() != null) {
                out.put("userType", "CUSTOMER");
                customerRepo.findById(ua.getCustomerId()).ifPresent(c -> {
                    out.put("firstName", c.getFirstName());
                    out.put("lastName", c.getLastName());
                    out.put("email", c.getEmail());
                    out.put("phone", c.getHomePhone());
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

            if (ua == null) {
                return ResponseEntity.status(404).body("User account not found");
            }

            // ---------------- CUSTOMER ----------------
            if (ua.getCustomerId() != null) {
                Customer c = customerRepo.findById(ua.getCustomerId()).orElse(null);

                if (c == null) {
                    return ResponseEntity.status(404).body("Customer not found");
                }

                c.setFirstName(req.getFirstName());
                c.setLastName(req.getLastName());
                c.setEmail(req.getEmail());
                c.setHomePhone(req.getHomePhone());

                customerRepo.save(c);

                return ResponseEntity.ok("Customer profile updated successfully");
            }

            // ---------------- EMPLOYEE ----------------
            if (ua.getEmployeeId() != null) {
                var emp = employeeRepo.findById(ua.getEmployeeId()).orElse(null);

                if (emp == null) {
                    return ResponseEntity.status(404).body("Employee not found");
                }

                emp.setFirstName(req.getFirstName());
                emp.setLastName(req.getLastName());
                emp.setEmail(req.getEmail());

                // Support both phone & homePhone
                if (req.getPhone() != null) {
                    emp.setPhone(req.getPhone());
                } else if (req.getHomePhone() != null) {
                    emp.setPhone(req.getHomePhone());
                }

                employeeRepo.save(emp);

                return ResponseEntity.ok("Employee profile updated successfully");
            }

            return ResponseEntity.status(404).body("Profile owner not found");

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

    //workshop 06 - get all active plans for customer (including addons)

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;

        if (val instanceof BigDecimal bd) return bd;

        if (val instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }

        return BigDecimal.ZERO;
    }

    @GetMapping("/api/me/plans")
    public ResponseEntity<?> getMyPlans(Authentication authentication) {
        String username = authentication.getName();

        UserAccount ua = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (ua.getCustomerId() == null) {
            return ResponseEntity.badRequest().body("This account is not linked to a customer");
        }

        List<Object[]> rows = subscriptionRepository.findActivePlansByCustomerId(ua.getCustomerId());

        List<CurrentPlanItemResponse> result = rows.stream().map((Object[] r) -> {
            Integer subscriptionId = ((Number) r[0]).intValue();
            Integer planId = ((Number) r[1]).intValue();
            String planName = (String) r[2];
            java.math.BigDecimal monthlyPrice = toBigDecimal(r[3]);
            java.math.BigDecimal addonTotal = toBigDecimal(r[4]);
            java.math.BigDecimal totalMonthlyPrice = toBigDecimal(r[5]);
            java.time.LocalDate startDate = r[6] != null ? ((java.sql.Date) r[6]).toLocalDate() : null;
            Integer contractTermMonths = r[7] != null ? ((Number) r[7]).intValue() : null;
            java.time.LocalDate endDate =
                    (startDate != null && contractTermMonths != null)
                            ? startDate.plusMonths(contractTermMonths)
                            : null;

            return new CurrentPlanItemResponse(
                    subscriptionId,
                    planId,
                    planName,
                    monthlyPrice,
                    addonTotal,
                    totalMonthlyPrice,
                    startDate,
                    contractTermMonths,
                    endDate
            );
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/me/addons")
    public ResponseEntity<?> getMyAddOns(Authentication authentication) {
        String username = authentication.getName();

        UserAccount ua = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (ua.getCustomerId() == null) {
            return ResponseEntity.badRequest().body("This account is not linked to a customer");
        }

        List<Object[]> rows = subscriptionAddOnRepository.findActiveAddOnsByCustomerId(ua.getCustomerId());

        List<MyAddonResponseDTO> result = rows.stream().map(r -> {
            LocalDate startDate = null;
            LocalDate endDate = null;

            if (r[7] instanceof java.sql.Date d) {
                startDate = d.toLocalDate();
            } else if (r[7] instanceof java.sql.Timestamp ts) {
                startDate = ts.toLocalDateTime().toLocalDate();
            }

            if (r[8] instanceof java.sql.Date d) {
                endDate = d.toLocalDate();
            } else if (r[8] instanceof java.sql.Timestamp ts) {
                endDate = ts.toLocalDateTime().toLocalDate();
            }

            return new MyAddonResponseDTO(
                    ((Number) r[0]).intValue(),
                    ((Number) r[1]).intValue(),
                    ((Number) r[2]).intValue(),
                    (String) r[3],
                    (String) r[4],
                    toBigDecimal(r[5]),
                    (String) r[6],
                    startDate,
                    endDate
            );
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/me/subscription/details")
    public ResponseEntity<?> getMySubscriptionDetails(Authentication authentication) {
        String username = authentication.getName();
        UserAccount ua = userAccountRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (ua == null || ua.getCustomerId() == null) {
            return ResponseEntity.status(404).body("UserAccount or customerId not found");
        }

        Integer customerId = ua.getCustomerId();
        SubscriptionDetailsDTO details = new SubscriptionDetailsDTO();

        // 1. Subscription
        List<org.example.model.Subscription> subs = subscriptionRepository.findByCustomerIdAndStatus(customerId, "Active");
        if (!subs.isEmpty()) {
            org.example.model.Subscription sub = subs.get(0);
            SubscriptionDetailsDTO.SubscriptionDTO subDTO = new SubscriptionDetailsDTO.SubscriptionDTO();
            subDTO.setSubscriptionId(sub.getSubscriptionId());
            subDTO.setStatus(sub.getStatus());
            subDTO.setStartDate(sub.getStartDate() != null ? sub.getStartDate().toString() : null);
            subDTO.setEndDate(sub.getEndDate() != null ? sub.getEndDate().toString() : null);
            subDTO.setBillingCycleDay(sub.getBillingCycleDay());
            details.setSubscription(subDTO);

            // 2. Plan
            PlanRepository.PlanRow planRow = planRepository.findPlanById(sub.getPlanId());
            if (planRow != null) {
                SubscriptionDetailsDTO.PlanInfoDTO planDTO = new SubscriptionDetailsDTO.PlanInfoDTO();
                planDTO.setPlanName(planRow.planName());
                planDTO.setMonthlyPrice(planRow.monthlyPrice());
                planDTO.setDescription(planRow.tagline());
                details.setPlan(planDTO);

                // 3. Features
                Map<Integer, List<PlanRepository.PlanFeatureRow>> featuresMap = planRepository.findPlanFeaturesByPlanIds(List.of(sub.getPlanId()));
                List<PlanRepository.PlanFeatureRow> featureRows = featuresMap.getOrDefault(sub.getPlanId(), List.of());
                details.setFeatures(featureRows.stream().map(fr -> {
                    SubscriptionDetailsDTO.FeatureInfoDTO f = new SubscriptionDetailsDTO.FeatureInfoDTO();
                    f.setName(fr.featureName());
                    f.setValue(fr.featureValue());
                    f.setUnit(fr.unit());
                    return f;
                }).toList());
            }

            // 4. Add-ons
            List<org.example.model.SubscriptionAddOn> saList = subscriptionAddOnRepository.findBySubscriptionId(sub.getSubscriptionId());
            details.setAddOns(saList.stream().map(sa -> {
                SubscriptionDetailsDTO.AddOnInfoDTO addOnDTO = new SubscriptionDetailsDTO.AddOnInfoDTO();
                org.example.dto.AddOnDTO a = addOnRepository.findById(sa.getAddOnId());
                if (a != null) {
                    addOnDTO.setAddOnName(a.addOnName());
                    addOnDTO.setMonthlyPrice(a.monthlyPrice());
                } else {
                    addOnDTO.setAddOnName("Unknown Add-on");
                    addOnDTO.setMonthlyPrice(0.0);
                }
                return addOnDTO;
            }).toList());
        }

        // 5. Payments
        List<org.example.entity.Payments> payments = paymentRepository.findByCustomerIdOrderByPaymentDateDesc(customerId);
        details.setPayments(payments.stream().map(p -> {
            SubscriptionDetailsDTO.PaymentInfoDTO pDTO = new SubscriptionDetailsDTO.PaymentInfoDTO();
            pDTO.setAmount(p.getAmount() != null ? p.getAmount().doubleValue() : 0.0);
            pDTO.setPaymentDate(p.getPaymentDate() != null ? p.getPaymentDate().toString() : null);
            pDTO.setMethod(p.getMethod());
            pDTO.setStatus(p.getStatus());
            return pDTO;
        }).toList());

        // 6. Invoices
        List<org.example.entity.Invoices> invoices = invoiceService.findAllByCustomerId(customerId);
        details.setInvoices(invoices.stream().map(invoiceService::convertToDTO).toList());

        return ResponseEntity.ok(details);
    }
}