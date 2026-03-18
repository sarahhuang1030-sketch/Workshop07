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

    // ------------------- Stripe: Add Card -------------------
    @PostMapping("/stripe")
    @Transactional
    public Map<String, Object> addCard(@RequestBody Map<String, Object> body,
                                       Principal principal,
                                       @AuthenticationPrincipal OAuth2User oauthUser) throws StripeException {

        // ------------------- Extract request body -------------------
        String paymentMethodId = (String) body.get("stripePaymentMethodId");
        String holderName = (String) body.get("holderName");
        Boolean setAsDefault = body.get("setAsDefault") != null && (Boolean) body.get("setAsDefault");

        if (paymentMethodId == null || paymentMethodId.isBlank()) {
            throw new RuntimeException("PaymentMethod ID is required");
        }
        if (holderName == null || holderName.isBlank()) {
            throw new RuntimeException("Cardholder name is required");
        }

        // ------------------- Resolve user -------------------
        String key = resolveLoginKey(principal, null, oauthUser);
        UserAccount userAccount = userAccountRepo.findByUsernameIgnoreCase(key)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ------------------- Ensure Stripe Customer exists -------------------
        String stripeCustomerId = userAccount.getStripeCustomerId();
        if (stripeCustomerId == null || stripeCustomerId.isBlank()) {
            // Create Stripe customer for first-time users
            com.stripe.model.Customer customer = com.stripe.model.Customer.create(
                    com.stripe.param.CustomerCreateParams.builder()
                            .setName(userAccount.getUsername())
                            .build()
            );
            stripeCustomerId = customer.getId();
            userAccount.setStripeCustomerId(stripeCustomerId);
            userAccountRepo.save(userAccount);
        }

        // ------------------- Attach payment method to Stripe customer -------------------
        PaymentMethod paymentMethod = null;
        try {
            paymentMethod = stripeService.attachPaymentMethodToCustomer(stripeCustomerId, paymentMethodId);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        if (paymentMethod.getCard() == null) {
            throw new RuntimeException("PaymentMethod card details are missing");
        }

        // ------------------- Save card to PaymentAccounts table -------------------
        Integer customerId = userAccount.getCustomerId();
        if (customerId == null) {
            throw new RuntimeException("UserAccount.customerId is missing");
        }

        PaymentAccounts account = new PaymentAccounts();
        account.setCustomerId(customerId);
        account.setHolderName(holderName);
        account.setMethod(paymentMethod.getCard().getBrand());
        account.setStripePaymentMethodId(paymentMethod.getId());
        account.setLast4(paymentMethod.getCard().getLast4());
        account.setCreatedAt(java.time.LocalDateTime.now());

        // ------------------- Handle default card -------------------
        if (setAsDefault) {
            // Reset previous default cards
            List<PaymentAccounts> existingCards = paymentAccountRepo.findAllByCustomerIdOrderByCreatedAtDesc(customerId);
            for (PaymentAccounts c : existingCards) {
                c.setIsDefault(0);
                paymentAccountRepo.save(c);
            }
            account.setIsDefault(1);
        } else {
            account.setIsDefault(0);
        }

        // Save new card
        paymentAccountRepo.save(account);

        // ------------------- Audit log -------------------
        auditService.log("PaymentMethod", "Add",
                "Customer " + customerId + " ••••" + paymentMethod.getCard().getLast4(), key);

        // ------------------- Return response -------------------
        Map<String, Object> result = new HashMap<>();
        result.put("stripeCustomerId", stripeCustomerId);
        result.put("stripePaymentMethodId", paymentMethod.getId());
        result.put("last4", paymentMethod.getCard().getLast4());
        result.put("method", paymentMethod.getCard().getBrand());
        result.put("holderName", holderName);
        result.put("isDefault", setAsDefault);

        return result;
    }

    // ------------------- Stripe: Get Customer Cards -------------------
    @GetMapping("/stripe")
    public Map<String, Object> getCustomerCards(@RequestParam String stripeCustomerId) throws StripeException {

        // Convert String to Integer
        Integer customerId;
        try {
            customerId = Integer.parseInt(stripeCustomerId);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid stripeCustomerId: " + stripeCustomerId);
        }

        // Retrieve Stripe default payment method if available
        com.stripe.model.Customer customer = com.stripe.model.Customer.retrieve(stripeCustomerId);
        List<PaymentMethod> pmList = new ArrayList<>();
        if (customer.getInvoiceSettings() != null && customer.getInvoiceSettings().getDefaultPaymentMethod() != null) {
            PaymentMethod pm = PaymentMethod.retrieve(customer.getInvoiceSettings().getDefaultPaymentMethod());
            pmList.add(pm);
        }

        // Retrieve all payment accounts from DB for this customer
        List<PaymentAccounts> cards = paymentAccountRepo.findAllByCustomerIdOrderByCreatedAtDesc(customerId);

        // Map DB records to a clean response
        List<Map<String, Object>> cardMaps = new ArrayList<>();
        for (PaymentAccounts c : cards) {
            Map<String, Object> map = new HashMap<>();
            map.put("stripeCustomerId", c.getCustomerId());
            map.put("stripePaymentMethodId", c.getStripePaymentMethodId());
            map.put("last4", c.getLast4());
            map.put("method", c.getMethod());
            map.put("holderName", c.getHolderName());
            map.put("isDefault", c.getIsDefault() != null && c.getIsDefault() == 1);
            cardMaps.add(map);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("cards", cardMaps);
        return result;
    }

    // ------------------- GET Payment Info (DB) -------------------
    @GetMapping
    public ResponseEntity<?> getPayment(Principal principal,
                                        @AuthenticationPrincipal OAuth2User oauthUser) {
        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveLoginKey(principal, null, oauthUser);
        UserAccount userAccount = userAccountRepo.findByUsernameIgnoreCase(key)
                .orElse(null);
        if (userAccount == null || userAccount.getCustomerId() == null) return ResponseEntity.noContent().build();

        Integer customerId = userAccount.getCustomerId();
        PaymentAccounts account = paymentAccountRepo.findFirstByCustomerIdOrderByCreatedAtDesc(customerId)
                .orElse(null);
        if (account == null) return ResponseEntity.noContent().build();

        return ResponseEntity.ok(mapToDTO(account));
    }

    // ------------------- PUT Update Payment -------------------
    @Transactional
    @PutMapping
    public ResponseEntity<?> updatePayment(@RequestBody PaymentUpdateDTO dto,
                                           Principal principal,
                                           Authentication auth,
                                           @AuthenticationPrincipal OAuth2User oauthUser) {

        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String key = resolveLoginKey(principal, auth, oauthUser);
        UserAccount userAccount = userAccountRepo.findByUsernameIgnoreCase(key)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userAccount.getCustomerId() == null)
            return ResponseEntity.status(409).body("NEEDS_REGISTRATION");

        Integer customerId = userAccount.getCustomerId();
        PaymentAccounts account = paymentAccountRepo
                .findFirstByCustomerIdOrderByCreatedAtDesc(customerId)
                .orElse(new PaymentAccounts());

        account.setCustomerId(customerId);
        account.setMethod(dto.getMethod());
        account.setHolderName(dto.getHolderName());
        account.setCardNumber(dto.getCardNumber());
        account.setCvv(dto.getCvv());
        account.setExpiredDate(dto.getExpiredDate());
        account.setExpiryMonth(dto.getExpiryMonth());
        account.setExpiryYear(dto.getExpiryYear());
        account.setStripePaymentMethodId(dto.getStripePaymentMethodId());
        account.setLast4(dto.getCardNumber() != null && dto.getCardNumber().length() >= 4
                ? dto.getCardNumber().substring(dto.getCardNumber().length() - 4)
                : null);
        account.setCreatedAt(LocalDateTime.now());

        paymentAccountRepo.save(account);

        auditService.log("PaymentMethod", "Update", "Customer " + customerId + " ••••" +
                (account.getLast4() != null ? account.getLast4() : ""), key);

        return ResponseEntity.ok(mapToDTO(account));
    }

    // ------------------- Helper -------------------
    private BillingPaymentDTO mapToDTO(PaymentAccounts account) {
        BillingPaymentDTO dto = new BillingPaymentDTO();
        dto.setMethod(account.getMethod());
        dto.setHolderName(account.getHolderName());
        dto.setCardNumber(account.getCardNumber());
        dto.setCvv(account.getCvv());
        dto.setExpiredDate(account.getExpiredDate());
        dto.setLast4(account.getLast4());
        dto.setExpiryMonth(account.getExpiryMonth());
        dto.setExpiryYear(account.getExpiryYear());
        dto.setStripePaymentMethodId(account.getStripePaymentMethodId());
        dto.setBalance(account.getBalance());
        dto.setDisplayCard(account.getMethod() + " ••••" + (account.getLast4() != null ? account.getLast4() : ""));
        return dto;
    }

    private String resolveLoginKey(Principal principal, Authentication auth, OAuth2User oauthUser) {
        if (auth instanceof OAuth2AuthenticationToken oauthTok) {
            Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : Map.of();
            Object email = attrs.get("email");
            if (email != null && !email.toString().isBlank()) return email.toString().trim();
            Object preferred = attrs.get("preferred_username");
            if (preferred != null && !preferred.toString().isBlank()) return preferred.toString().trim();
            Object login = attrs.get("login");
            if (login != null && !login.toString().isBlank()) return login.toString().trim();
            String provider = oauthTok.getAuthorizedClientRegistrationId().toLowerCase();
            String externalId = firstNonBlank(str(attrs.get("sub")), str(attrs.get("id")), str(attrs.get("login")));
            if (externalId != null && !externalId.isBlank()) return (provider + ":" + externalId).toLowerCase();
        }
        return principal.getName();
    }

    private static String str(Object o) {
        return o == null ? null : o.toString().trim();
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) if (v != null && !v.trim().isEmpty()) return v.trim();
        return null;
    }
}