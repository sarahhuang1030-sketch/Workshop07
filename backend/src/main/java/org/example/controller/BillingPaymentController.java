package org.example.controller;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentMethod;
import org.example.dto.BillingPaymentDTO;
import org.example.dto.PaymentUpdateDTO;
import org.example.entity.PaymentAccounts;
import org.example.model.UserAccount;
import org.example.repository.PaymentAccountRepository;
import org.example.repository.UserAccountRepository;
import org.example.service.AuditService;
import org.example.service.StripePaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/billing/payment")
public class BillingPaymentController {

    private final UserAccountRepository userAccountRepo;
    private final PaymentAccountRepository paymentAccountRepo;
    private final StripePaymentService stripeService;
    private final AuditService auditService;

    public BillingPaymentController(UserAccountRepository userAccountRepo,
                                    PaymentAccountRepository paymentAccountRepo,
                                    StripePaymentService stripeService,
                                    AuditService auditService) {
        this.userAccountRepo = userAccountRepo;
        this.paymentAccountRepo = paymentAccountRepo;
        this.stripeService = stripeService;
        this.auditService = auditService;
    }

    // ======================= ADD CARD =======================
    @PostMapping("/stripe")
    @Transactional
    public Map<String, Object> addCard(@RequestBody Map<String, Object> body,
                                       Principal principal,
                                       @AuthenticationPrincipal OAuth2User oauthUser) throws Exception {

        // Ensure user is authenticated
        if (principal == null) {
            throw new RuntimeException("User not authenticated");
        }

        // Extract request data
        String paymentMethodId = (String) body.get("stripePaymentMethodId");
        String holderName = (String) body.get("holderName");
        Boolean setAsDefault = body.get("setAsDefault") != null && (Boolean) body.get("setAsDefault");

        if (paymentMethodId == null || paymentMethodId.isBlank()) {
            throw new RuntimeException("PaymentMethod ID is required");
        }

        if (holderName == null || holderName.isBlank()) {
            throw new RuntimeException("Cardholder name is required");
        }

        // Resolve current user
        String key = resolveLoginKey(principal, null, oauthUser);

        UserAccount userAccount = userAccountRepo.findByUsernameIgnoreCase(key)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Ensure Stripe customer exists
        String stripeCustomerId = userAccount.getStripeCustomerId();

        if (stripeCustomerId == null || stripeCustomerId.isBlank()) {
            com.stripe.model.Customer customer = com.stripe.model.Customer.create(
                    com.stripe.param.CustomerCreateParams.builder()
                            .setName(userAccount.getUsername())
                            .build()
            );

            stripeCustomerId = customer.getId();
            userAccount.setStripeCustomerId(stripeCustomerId);
            userAccountRepo.save(userAccount);
        }

        // Attach payment method to Stripe customer
        PaymentMethod paymentMethod = stripeService
                .attachPaymentMethodToCustomer(stripeCustomerId, paymentMethodId);

        if (paymentMethod.getCard() == null) {
            throw new RuntimeException("Invalid card data");
        }

        // Save card into database
        Integer customerId = userAccount.getCustomerId();

        if (customerId == null) {
            throw new RuntimeException("CustomerId is missing");
        }

        PaymentAccounts account = new PaymentAccounts();
        account.setCustomerId(customerId);
        account.setHolderName(holderName);
        account.setMethod(paymentMethod.getCard().getBrand());
        account.setStripePaymentMethodId(paymentMethod.getId());
        account.setLast4(paymentMethod.getCard().getLast4());
        account.setCreatedAt(LocalDateTime.now());

        // Handle default card
        if (setAsDefault) {
            List<PaymentAccounts> existingCards =
                    paymentAccountRepo.findAllByCustomerIdOrderByCreatedAtDesc(customerId);

            for (PaymentAccounts c : existingCards) {
                c.setIsDefault(0);
                paymentAccountRepo.save(c);
            }
            account.setIsDefault(1);
        } else {
            account.setIsDefault(0);
        }

        paymentAccountRepo.save(account);

        // Audit log
        auditService.log("PaymentMethod", "Add",
                "Customer " + customerId + " ••••" + paymentMethod.getCard().getLast4(),
                key);

        // Return response
        Map<String, Object> result = new HashMap<>();
        result.put("stripeCustomerId", stripeCustomerId);
        result.put("stripePaymentMethodId", paymentMethod.getId());
        result.put("last4", paymentMethod.getCard().getLast4());
        result.put("method", paymentMethod.getCard().getBrand());
        result.put("holderName", holderName);
        result.put("isDefault", setAsDefault);

        return result;
    }

    // ======================= GET PAYMENT =======================
    @GetMapping
    public ResponseEntity<Map<String, Object>> getPayment(Principal principal,
                                                          @AuthenticationPrincipal OAuth2User oauthUser) {
        System.out.println("=== GET /api/billing/payment called ===");
        System.out.println("Principal: " + principal);
        System.out.println("OAuth2User: " + oauthUser);

        Map<String, Object> response = new HashMap<>();
        response.put("stripeCustomerId", null);
        response.put("payment", null);

        if (principal == null) {
            System.out.println("No principal! User not authenticated.");
            return ResponseEntity.ok(response);
        }

        String key = resolveLoginKey(principal, null, oauthUser);
        System.out.println("Resolved login key: " + key);

        if (key == null || key.isBlank()) {
            System.out.println("Login key is null/blank.");
            return ResponseEntity.ok(response);
        }

        UserAccount userAccount = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        System.out.println("Found UserAccount: " + userAccount);

        if (userAccount == null) return ResponseEntity.ok(response);

        response.put("stripeCustomerId", userAccount.getStripeCustomerId());

        Integer customerId = userAccount.getCustomerId();
        System.out.println("CustomerId: " + customerId);

        if (customerId != null) {
            PaymentAccounts account = paymentAccountRepo
                    .findFirstByCustomerIdOrderByCreatedAtDesc(customerId)
                    .orElse(null);
            if (account != null) {
                System.out.println("Found payment account: " + account.getLast4());
                response.put("payment", mapToDTO(account));
            }
        }

        return ResponseEntity.ok(response);
    }

    // ======================= HELPER =======================
    private BillingPaymentDTO mapToDTO(PaymentAccounts account) {
        BillingPaymentDTO dto = new BillingPaymentDTO();
        dto.setMethod(account.getMethod());
        dto.setHolderName(account.getHolderName());
        dto.setCardNumber(account.getCardNumber());
        dto.setCvv(account.getCvv());
        dto.setExpiryMonth(account.getExpiryMonth());
        dto.setExpiryYear(account.getExpiryYear());
        dto.setLast4(account.getLast4());
        dto.setDisplayCard("**** **** **** " + account.getLast4());
        dto.setBalance(account.getBalance());
        dto.setExpiredDate(account.getExpiryYear() != null && account.getExpiryMonth() != null
                ? LocalDateTime.of(account.getExpiryYear(), account.getExpiryMonth(), 1, 0, 0).toLocalDate()
                : null);
        dto.setStripePaymentMethodId(account.getStripePaymentMethodId());
        return dto;
    }

    // Resolve login key (supports OAuth2 and normal login)
    private String resolveLoginKey(Principal principal, Authentication auth, OAuth2User oauthUser) {
        System.out.println("=== resolveLoginKey called ===");
        System.out.println("Principal: " + principal);
        System.out.println("Authentication: " + auth);
        System.out.println("OAuth2User: " + oauthUser);

        if (auth instanceof OAuth2AuthenticationToken oauthTok) {
            Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : Map.of();
            System.out.println("OAuth2 Attributes: " + attrs);

            Object email = attrs.get("email");
            if (email != null) return email.toString();

            Object login = attrs.get("login");
            if (login != null) return login.toString();
        }

        String name = principal.getName();
        System.out.println("Fallback principal name: " + name);
        return name;
    }
}