package org.example.controller;

import org.example.dto.ManagerSubscriptionDTO;
import org.example.dto.SubscriptionAddOnDTO;
import org.example.dto.AddOnDTO;
import org.example.model.Customer;
import org.example.model.Plan;
import org.example.model.Subscription;
import org.example.model.UserAccount;
import org.example.repository.*;
import org.example.service.AuditService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
        this.userAccountRepository=userAccountRepository;
        this.customerRepository = customerRepository;
        this.planRepository = planRepository;
    }

    @GetMapping
    public List<ManagerSubscriptionDTO> getAll() {
        Map<Integer, String> addOnNameMap = addOnRepository.findAllActiveAddOns().stream()
                .collect(Collectors.toMap(AddOnDTO::addOnId, AddOnDTO::addOnName));

        return subscriptionRepository.findAll().stream().map(sub -> {
            ManagerSubscriptionDTO dto = new ManagerSubscriptionDTO();
            dto.setSubscriptionId(sub.getSubscriptionId());
            dto.setCustomerId(sub.getCustomerId());
            dto.setPlanId(sub.getPlanId());

            // Customer Name
            Customer customer = customerRepository.findById(sub.getCustomerId()).orElse(null);

            if (customer != null) {
                if (customer.getBusinessName() != null && !customer.getBusinessName().isBlank()) {
                    dto.setCustomerName(customer.getBusinessName());
                } else {
                    String first = customer.getFirstName() != null ? customer.getFirstName() : "";
                    String last = customer.getLastName() != null ? customer.getLastName() : "";
                    dto.setCustomerName((first + " " + last).trim());
                }
            } else {
                dto.setCustomerName(null);
            }

        // Plan Name
            PlanRepository.PlanRow plan = planRepository.findPlanById(sub.getPlanId());

            if (plan != null) {
                dto.setPlanName(plan.planName());
            } else {
                dto.setPlanName(null);
            }

            if (plan != null) {
                dto.setPlanName(plan.planName());
            } else {
                dto.setPlanName(null);
            }
            dto.setStartDate(sub.getStartDate());
            dto.setEndDate(sub.getEndDate());
            dto.setStatus(sub.getStatus());
            dto.setBillingCycleDay(sub.getBillingCycleDay());
            dto.setNotes(sub.getNotes());

            List<SubscriptionAddOnDTO> addons = subscriptionAddOnRepository
                    .findBySubscriptionId(sub.getSubscriptionId())
                    .stream()
                    .map(sa -> {
                        SubscriptionAddOnDTO a = new SubscriptionAddOnDTO();
                        a.setSubscriptionAddOnId(sa.getSubscriptionAddOnId());
                        a.setAddOnId(sa.getAddOnId());
                        a.setAddOnName(addOnNameMap.get(sa.getAddOnId()));
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
    public Subscription updateStatus(@PathVariable Integer id,
                                     @RequestBody Map<String, String> body,
                                     Authentication authentication) {
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
    public Subscription create(@RequestBody Subscription body,
                               Authentication authentication) {

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

//    Helper for subscription link to employee
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
    public Subscription update(@PathVariable Integer id,
                               @RequestBody Subscription body,
                               Authentication authentication) {
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
    public void delete(@PathVariable Integer id,
                       Authentication authentication) {
        Subscription sub = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        String username = authentication.getName();
        String target = "Subscription " + sub.getSubscriptionId()
                + " (Customer " + sub.getCustomerId()
                + ", Plan " + sub.getPlanId() + ")";

        subscriptionRepository.deleteById(id);

        auditService.log("Subscription", "Delete", target, username);
    }

    @GetMapping("/{id}")
    public Subscription getById(@PathVariable Integer id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));
    }
}