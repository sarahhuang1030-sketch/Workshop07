package org.example.controller;

import org.example.dto.AddOnDTO;
import org.example.dto.ManagerSubscriptionDTO;
import org.example.dto.SubscriptionAddOnDTO;
import org.example.model.Customer;
import org.example.model.Plan;
import org.example.model.Subscription;
import org.example.model.SubscriptionAddOn;
import org.example.model.UserAccount;
import org.example.repository.AddOnRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.PlanRepository;
import org.example.repository.SubscriptionAddOnRepository;
import org.example.repository.SubscriptionRepository;
import org.example.repository.UserAccountRepository;
import org.example.service.AuditService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/manager/subscriptions")
public class ManagerSubscriptionController {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionAddOnRepository subscriptionAddOnRepository;
    private final AddOnRepository addOnRepository;
    private final AuditService auditService;
    private final UserAccountRepository userAccountRepository;
    private final CustomerRepository customerRepository;
    private final PlanRepository planRepository;

    public ManagerSubscriptionController(
            SubscriptionRepository subscriptionRepository,
            SubscriptionAddOnRepository subscriptionAddOnRepository,
            AddOnRepository addOnRepository,
            AuditService auditService,
            UserAccountRepository userAccountRepository,
            CustomerRepository customerRepository,
            PlanRepository planRepository
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.subscriptionAddOnRepository = subscriptionAddOnRepository;
        this.addOnRepository = addOnRepository;
        this.auditService = auditService;
        this.userAccountRepository = userAccountRepository;
        this.customerRepository = customerRepository;
        this.planRepository = planRepository;
    }

    @GetMapping
    public List<ManagerSubscriptionDTO> getAll() {

        Map<Integer, String> addOnNameMap = addOnRepository.findAllActiveAddOns()
                .stream()
                .filter(a -> a != null)
                .collect(Collectors.toMap(
                        AddOnDTO::addOnId,
                        AddOnDTO::addOnName,
                        (a, b) -> a
                ));

        Map<Integer, BigDecimal> addOnPriceMap = addOnRepository.findAllActiveAddOns()
                .stream()
                .filter(a -> a != null)
                .collect(Collectors.toMap(
                        AddOnDTO::addOnId,
                        a -> BigDecimal.valueOf(a.monthlyPrice()),
                        (x, y) -> x
                ));

        return subscriptionRepository.findAllWithRelationsRaw().stream().map(row -> {

            Object[] sub = (Object[]) row;

            if (sub == null) {
                throw new RuntimeException("SQL result is null");
            }

            if (sub.length < 15) {
                throw new RuntimeException("Invalid SQL result length: " + sub.length);
            }

            ManagerSubscriptionDTO dto = new ManagerSubscriptionDTO();

            Integer subscriptionId = (Integer) sub[0];
            Integer customerId = (Integer) sub[1];
            Integer planId = (Integer) sub[2];

            dto.setSubscriptionId(subscriptionId);
            dto.setCustomerId(customerId);
            dto.setPlanId(planId);

            LocalDate startDate = sub[3] == null
                    ? null
                    : ((java.sql.Date) sub[3]).toLocalDate();

            LocalDate endDate = sub[4] == null
                    ? null
                    : ((java.sql.Date) sub[4]).toLocalDate();

            Customer customer = new Customer();
            if (sub.length > 8 && sub[8] != null) {
                customer.setCustomerId((Integer) sub[8]);
            }
            if (sub.length > 9) {
                customer.setBusinessName((String) sub[9]);
            }
            if (sub.length > 10) {
                customer.setFirstName((String) sub[10]);
            }
            if (sub.length > 11) {
                customer.setLastName((String) sub[11]);
            }

            Plan plan = new Plan();
            if (sub.length > 12 && sub[12] != null) {
                plan.setPlanId((Integer) sub[12]);
            }
            if (sub.length > 13) {
                plan.setPlanName((String) sub[13]);
            }
            if (sub.length > 14 && sub[14] != null) {
                plan.setMonthlyPrice((BigDecimal) sub[14]);
            }

            Subscription subscription = new Subscription();
            subscription.setSubscriptionId(subscriptionId);
            subscription.setCustomerId(customerId);
            subscription.setPlanId(planId);
            subscription.setStartDate(startDate);
            subscription.setEndDate(endDate);
            subscription.setStatus((String) sub[5]);
            subscription.setBillingCycleDay((Integer) sub[6]);
            subscription.setNotes((String) sub[7]);

            subscription.setCustomer(customer);
            subscription.setPlan(plan);

            if (customer != null) {
                if (customer.getBusinessName() != null && !customer.getBusinessName().isBlank()) {
                    dto.setCustomerName(customer.getBusinessName());
                } else {
                    String first = customer.getFirstName() != null ? customer.getFirstName() : "";
                    String last = customer.getLastName() != null ? customer.getLastName() : "";
                    dto.setCustomerName((first + " " + last).trim());
                }
            }

            if (plan != null) {
                dto.setPlanName(plan.getPlanName());
                dto.setMonthlyPrice(plan.getMonthlyPrice());
            }

            dto.setStartDate(startDate);
            dto.setEndDate(endDate);
            dto.setStatus(subscription.getStatus());
            dto.setBillingCycleDay(subscription.getBillingCycleDay());
            dto.setNotes(subscription.getNotes());

            List<SubscriptionAddOnDTO> addons = subscriptionAddOnRepository
                    .findBySubscriptionId(subscriptionId)
                    .stream()
                    .map(sa -> {
                        SubscriptionAddOnDTO a = new SubscriptionAddOnDTO();
                        a.setSubscriptionAddOnId(sa.getSubscriptionAddOnId());
                        a.setAddOnId(sa.getAddOnId());
                        a.setAddOnName(addOnNameMap.get(sa.getAddOnId()));
                        a.setPrice(addOnPriceMap.getOrDefault(sa.getAddOnId(), BigDecimal.ZERO));
                        a.setStartDate(sa.getStartDate());
                        a.setEndDate(sa.getEndDate());
                        a.setStatus(sa.getStatus());
                        return a;
                    })
                    .toList();

            dto.setAddons(addons);

            return dto;

        }).toList();
    }

    @PatchMapping("/{id}/status")
    public Subscription updateStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        subscription.setStatus(body.get("status"));
        Subscription saved = subscriptionRepository.save(subscription);

        String username = authentication.getName();
        String status = body.get("status");

        String target = "Subscription " + saved.getSubscriptionId()
                + " (Customer " + saved.getCustomerId()
                + ", Plan " + saved.getPlanId() + ")";

        auditService.log("Subscription", "StatusChange", target + " -> " + status, username);

        return saved;
    }

    @PostMapping
    public Subscription create(
            @RequestBody Subscription body,
            Authentication authentication
    ) {

        Integer currentEmployeeId = getCurrentEmployeeId(authentication);
        body.setSoldByEmployeeId(currentEmployeeId);

        Subscription saved = subscriptionRepository.save(body);

        String username = authentication.getName();

        String target = "Subscription " + saved.getSubscriptionId()
                + " (Customer " + saved.getCustomerId()
                + ", Plan " + saved.getPlanId() + ")";

        auditService.log("Subscription", "Create", target, username);

        return saved;
    }

    private Integer getCurrentEmployeeId(Authentication authentication) {
        String username = authentication.getName();

        UserAccount ua = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (ua.getEmployeeId() == null) {
            throw new RuntimeException("Current user is not an employee");
        }

        return ua.getEmployeeId();
    }

    @PutMapping("/{id}")
    public Subscription update(
            @PathVariable Integer id,
            @RequestBody Subscription body,
            Authentication authentication
    ) {

        Subscription sub = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        sub.setCustomerId(body.getCustomerId());
        sub.setPlanId(body.getPlanId());
        sub.setStartDate(body.getStartDate());
        sub.setEndDate(body.getEndDate());
        sub.setStatus(body.getStatus());
        sub.setBillingCycleDay(body.getBillingCycleDay());
        sub.setNotes(body.getNotes());

        Subscription saved = subscriptionRepository.save(sub);

        String username = authentication.getName();

        String target = "Subscription " + saved.getSubscriptionId()
                + " (Customer " + saved.getCustomerId()
                + ", Plan " + saved.getPlanId() + ")";

        auditService.log("Subscription", "Update", target, username);

        return saved;
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Integer id,
            Authentication authentication
    ) {

        Subscription sub = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        String username = authentication.getName();

        String target = "Subscription " + sub.getSubscriptionId()
                + " (Customer " + sub.getCustomerId()
                + ", Plan " + sub.getPlanId() + ")";

        List<SubscriptionAddOn> addons =
                subscriptionAddOnRepository.findBySubscriptionId(id);

        if (addons != null && !addons.isEmpty()) {
            subscriptionAddOnRepository.deleteAll(addons);
        }

        subscriptionRepository.deleteById(id);

        auditService.log("Subscription", "Delete", target, username);
    }

    @GetMapping("/{id}")
    public Subscription getById(@PathVariable Integer id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));
    }

    @GetMapping("/{subscriptionId}/addons")
    public List<SubscriptionAddOnDTO> getSubscriptionAddOns(@PathVariable Integer subscriptionId) {

        Map<Integer, String> addOnNameMap = addOnRepository.findAllActiveAddOns().stream()
                .collect(Collectors.toMap(AddOnDTO::addOnId, AddOnDTO::addOnName));

        Map<Integer, BigDecimal> addOnPriceMap = addOnRepository.findAllActiveAddOns().stream()
                .collect(Collectors.toMap(
                        AddOnDTO::addOnId,
                        a -> BigDecimal.valueOf(a.monthlyPrice())
                ));

        return subscriptionAddOnRepository.findBySubscriptionId(subscriptionId)
                .stream()
                .map(sa -> {
                    SubscriptionAddOnDTO dto = new SubscriptionAddOnDTO();
                    dto.setSubscriptionAddOnId(sa.getSubscriptionAddOnId());
                    dto.setAddOnId(sa.getAddOnId());
                    dto.setAddOnName(addOnNameMap.get(sa.getAddOnId()));
                    dto.setPrice(addOnPriceMap.getOrDefault(sa.getAddOnId(), BigDecimal.ZERO));
                    dto.setStartDate(sa.getStartDate());
                    dto.setEndDate(sa.getEndDate());
                    dto.setStatus(sa.getStatus());
                    return dto;
                })
                .toList();
    }

    @PostMapping("/{subscriptionId}/addons/{addOnId}")
    public void attachAddOnToSubscription(
            @PathVariable Integer subscriptionId,
            @PathVariable Integer addOnId,
            Authentication authentication
    ) {

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        boolean addOnExists = addOnRepository.findAllActiveAddOns().stream()
                .anyMatch(a -> a.addOnId() == addOnId);

        if (!addOnExists) {
            throw new RuntimeException("Add-on not found");
        }

        boolean alreadyExists =
                subscriptionAddOnRepository.findBySubscriptionId(subscriptionId)
                        .stream()
                        .anyMatch(sa -> sa.getAddOnId() != null
                                && sa.getAddOnId().equals(addOnId));

        if (alreadyExists) {
            return;
        }

        SubscriptionAddOn sa = new SubscriptionAddOn();
        sa.setSubscriptionId(subscriptionId);
        sa.setAddOnId(addOnId);
        sa.setStartDate(subscription.getStartDate() != null
                ? subscription.getStartDate()
                : LocalDate.now());
        sa.setEndDate(null);
        sa.setStatus("Active");

        subscriptionAddOnRepository.save(sa);

        auditService.log(
                "SubscriptionAddOn",
                "Attach",
                "Subscription " + subscriptionId + " -> Add-on " + addOnId,
                authentication.getName()
        );
    }

    @DeleteMapping("/{subscriptionId}/addons/{addOnId}")
    public void removeAddOnFromSubscription(
            @PathVariable Integer subscriptionId,
            @PathVariable Integer addOnId,
            Authentication authentication
    ) {

        SubscriptionAddOn existing = subscriptionAddOnRepository.findBySubscriptionId(subscriptionId)
                .stream()
                .filter(sa -> sa.getAddOnId() != null && sa.getAddOnId().equals(addOnId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Subscription add-on not found"));

        subscriptionAddOnRepository.deleteById(existing.getSubscriptionAddOnId());

        auditService.log(
                "SubscriptionAddOn",
                "Remove",
                "Subscription " + subscriptionId + " -> Add-on " + addOnId,
                authentication.getName()
        );
    }
}