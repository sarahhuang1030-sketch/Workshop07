package org.example.controller;

import org.example.dto.ReviewPlanDTO;
import org.example.model.UserAccount;
import org.example.repository.SubscriptionRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/customer")
public class CustomerReviewController {

    private final UserAccountRepository userAccountRepository;
    private final SubscriptionRepository subscriptionRepository;

    public CustomerReviewController(UserAccountRepository userAccountRepository,
                                    SubscriptionRepository subscriptionRepository) {
        this.userAccountRepository = userAccountRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @GetMapping("/review-plans")
    public List<ReviewPlanDTO> getReviewPlans(Authentication authentication) {
        String username = authentication.getName();

        UserAccount ua = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Integer customerId = ua.getCustomerId();
        if (customerId == null) {
            throw new RuntimeException("No customer profile found");
        }

        List<Object[]> rows = subscriptionRepository.findActivePlansByCustomerIdRaw(customerId);

        return rows.stream()
                .map(row -> new ReviewPlanDTO(
                        ((Number) row[0]).intValue(),   // subscriptionId
                        ((Number) row[2]).intValue(),   // planId
                        String.valueOf(row[4])          // planName
                ))
                .toList();
    }
}