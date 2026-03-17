package org.example.controller;

import com.stripe.model.Customer;
import com.stripe.model.PaymentMethod;
import org.example.entity.PaymentAccounts;
import org.example.model.UserAccount;
import org.example.repository.PaymentAccountRepository;
import org.example.repository.UserAccountRepository;
import org.example.service.StripePaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/billing/payment/cards")
public class BillingPaymentController {

    private final UserAccountRepository userAccountRepo;
    private final PaymentAccountRepository paymentAccountRepo;
    private final StripePaymentService stripeService;

    public BillingPaymentController(UserAccountRepository userAccountRepo,
                                    PaymentAccountRepository paymentAccountRepo,
                                    StripePaymentService stripeService) {
        this.userAccountRepo = userAccountRepo;
        this.paymentAccountRepo = paymentAccountRepo;
        this.stripeService = stripeService;
    }

    // ------------------- GET: Load all cards (database + stripe) -------------------
    @GetMapping
    public ResponseEntity<?> getPayment(Principal principal) throws Exception {
        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        List<Map<String, Object>> cards = new ArrayList<>();

        var userOpt = userAccountRepo.findByUsernameIgnoreCase(principal.getName());
        if (userOpt.isPresent()) {
            UserAccount user = userOpt.get();
            Integer customerId = user.getCustomerId();

            // 1. Load saved cards from local database
            List<PaymentAccounts> dbCards = paymentAccountRepo.findAllByCustomerIdOrderByCreatedAtDesc(customerId);
            for (PaymentAccounts account : dbCards) {
                Map<String, Object> map = new HashMap<>();
                map.put("stripeCustomerId", user.getStripeCustomerId());
                map.put("stripePaymentMethodId", account.getStripePaymentMethodId());
                map.put("last4", account.getLast4());
                map.put("method", account.getMethod());
                map.put("holderName", account.getHolderName());
                cards.add(map);
            }

            // 2. Load default Stripe payment method
            if (user.getStripeCustomerId() != null) {
                Customer customer = Customer.retrieve(user.getStripeCustomerId());
                if (customer.getInvoiceSettings().getDefaultPaymentMethod() != null) {
                    PaymentMethod pm = PaymentMethod.retrieve(customer.getInvoiceSettings().getDefaultPaymentMethod());
                    boolean exists = cards.stream().anyMatch(c -> pm.getId().equals(c.get("stripePaymentMethodId")));
                    if (!exists) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("stripeCustomerId", user.getStripeCustomerId());
                        map.put("stripePaymentMethodId", pm.getId());
                        map.put("last4", pm.getCard().getLast4());
                        map.put("method", pm.getCard().getBrand());
                        map.put("holderName", pm.getBillingDetails().getName());
                        cards.add(map);
                    }
                }
            }
        }

        return ResponseEntity.ok(Map.of("cards", cards));
    }

    // ------------------- POST: Add new card -------------------
    @PostMapping
    @Transactional
    public ResponseEntity<?> addCard(@RequestBody Map<String, String> body,
                                     Principal principal) throws Exception {

        if (principal == null) return ResponseEntity.status(401).body("Not authenticated");

        String paymentMethodId = body.get("stripePaymentMethodId");
        String holderName = body.get("holderName");

        var userOpt = userAccountRepo.findByUsernameIgnoreCase(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body("User not found");

        UserAccount user = userOpt.get();

        // Create Stripe customer if missing
        if (user.getStripeCustomerId() == null) {
            Customer customer = stripeService.createStripeCustomer(user.getUsername());
            user.setStripeCustomerId(customer.getId());
            userAccountRepo.save(user);
        }

        // Attach card to Stripe customer
        PaymentMethod paymentMethod = stripeService.attachPaymentMethodToCustomer(user.getStripeCustomerId(), paymentMethodId);

        // Save locally
        PaymentAccounts account = new PaymentAccounts();
        account.setCustomerId(user.getCustomerId());
        account.setMethod(paymentMethod.getCard().getBrand());
        account.setHolderName(holderName);
        account.setStripePaymentMethodId(paymentMethod.getId());
        account.setLast4(paymentMethod.getCard().getLast4());
        account.setCreatedAt(LocalDateTime.now());
        paymentAccountRepo.save(account);

        Map<String, Object> response = Map.of(
                "stripeCustomerId", user.getStripeCustomerId(),
                "stripePaymentMethodId", paymentMethod.getId(),
                "last4", paymentMethod.getCard().getLast4(),
                "method", paymentMethod.getCard().getBrand(),
                "holderName", holderName
        );

        return ResponseEntity.ok(response);
    }
}