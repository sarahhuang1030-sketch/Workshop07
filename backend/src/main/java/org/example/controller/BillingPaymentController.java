package org.example.controller;

import com.stripe.model.PaymentMethod;
import org.example.dto.BillingPaymentDTO;
import org.example.entity.PaymentAccounts;
import org.example.model.UserAccount;
import org.example.repository.PaymentAccountRepository;
import org.example.repository.UserAccountRepository;
import org.example.service.AuditService;
import org.example.service.StripePaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/billing/payment")
public class BillingPaymentController {

    private final UserAccountRepository userAccountRepo;
    private final PaymentAccountRepository paymentAccountRepo;
    private final StripePaymentService stripeService;
    private final AuditService auditService;

    public BillingPaymentController(
            UserAccountRepository userAccountRepo,
            PaymentAccountRepository paymentAccountRepo,
            StripePaymentService stripeService,
            AuditService auditService
    ) {
        this.userAccountRepo = userAccountRepo;
        this.paymentAccountRepo = paymentAccountRepo;
        this.stripeService = stripeService;
        this.auditService = auditService;
    }

    // ================= GET ALL CARDS =================
    @GetMapping({"", "/all"})
    public ResponseEntity<List<BillingPaymentDTO>> getAllCards(Principal principal) {
        UserAccount user = getUserFromPrincipal(principal);
        if (user == null) return ResponseEntity.ok(Collections.emptyList());

        List<PaymentAccounts> cards = paymentAccountRepo
                .findAllByCustomerIdOrderByCreatedAtDesc(user.getCustomerId());

        List<BillingPaymentDTO> dtos = cards.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // ================= ADD NEW CARD =================
//    @PostMapping("/stripe")
//    @Transactional
//    public ResponseEntity<BillingPaymentDTO> addCard(@RequestBody Map<String, Object> body,
//                                                     Principal principal) throws Exception {
//
//        UserAccount user = getUserFromPrincipal(principal);
//        if (user == null) return ResponseEntity.status(401).build();
//
//        String paymentMethodId = (String) body.get("stripePaymentMethodId");
//        String holderName = (String) body.get("holderName");
//        boolean setDefault = Boolean.TRUE.equals(body.get("setAsDefault"));
//
//        if (paymentMethodId == null || holderName == null) {
//            return ResponseEntity.badRequest().build();
//        }
//
//        // ===== Ensure Stripe customer =====
//        String stripeCustomerId = user.getStripeCustomerId();
//        if (stripeCustomerId == null) {
//            stripeCustomerId = stripeService.createCustomer(user.getUsername());
//            user.setStripeCustomerId(stripeCustomerId);
//            userAccountRepo.save(user);
//        }
//
//        // ===== Attach card =====
//        PaymentMethod stripeCard =
//                stripeService.attachPaymentMethodToCustomer(stripeCustomerId, paymentMethodId);
//
//        PaymentAccounts account = new PaymentAccounts();
//        account.setCustomerId(user.getCustomerId());
//        account.setHolderName(holderName);
//        account.setMethod(stripeCard.getCard().getBrand());
//        account.setLast4(stripeCard.getCard().getLast4());
//        account.setStripePaymentMethodId(stripeCard.getId());
//        account.setCreatedAt(LocalDateTime.now());
//
//        account.setIsDefault(setDefault ? 1 : 0);
//
//
//        account.setExpiryMonth(
//                stripeCard.getCard().getExpMonth() != null
//                        ? stripeCard.getCard().getExpMonth().intValue()
//                        : null
//        );
//
//        account.setExpiryYear(
//                stripeCard.getCard().getExpYear() != null
//                        ? stripeCard.getCard().getExpYear().intValue()
//                        : null
//        );
//
//        // ===== Clear previous default =====
//        if (setDefault) {
//            List<PaymentAccounts> existing = paymentAccountRepo
//                    .findAllByCustomerIdOrderByCreatedAtDesc(user.getCustomerId());
//
//            for (PaymentAccounts c : existing) {
//                c.setIsDefault(0);
//                paymentAccountRepo.save(c);
//            }
//        }
//
//        paymentAccountRepo.save(account);
//
//        auditService.log(
//                "PaymentMethod",
//                "Add",
//                "Customer " + user.getCustomerId() + " ••••" + account.getLast4(),
//                user.getUsername()
//        );
//
//        return ResponseEntity.ok(mapToDTO(account));
//    }

    /**
     * Add Stripe payment method
     */
    @PostMapping("/stripe")
    @Transactional
    public ResponseEntity<BillingPaymentDTO> addCard(
            @RequestBody Map<String, Object> body,
            Principal principal
    ) throws Exception {

        UserAccount user = getUserFromPrincipal(principal);
        if (user == null) return ResponseEntity.status(401).build();

        String paymentMethodId = (String) body.get("stripePaymentMethodId");
        String holderName = (String) body.get("holderName");
        boolean setDefault = Boolean.TRUE.equals(body.get("setAsDefault"));

        if (paymentMethodId == null || holderName == null) {
            return ResponseEntity.badRequest().build();
        }

        // Ensure Stripe customer exists
        String stripeCustomerId = user.getStripeCustomerId();

        if (stripeCustomerId == null || stripeCustomerId.isEmpty()) {
            stripeCustomerId = stripeService.createCustomer(user.getUsername());
            user.setStripeCustomerId(stripeCustomerId);
            userAccountRepo.save(user);
        }

        // Attach PaymentMethod to Stripe customer
        PaymentMethod stripeCard =
                stripeService.attachPaymentMethodToCustomer(
                        stripeCustomerId,
                        paymentMethodId
                );

        // Reset default if needed
        if (setDefault) {
            List<PaymentAccounts> cards =
                    paymentAccountRepo.findAllByCustomerIdOrderByCreatedAtDesc(user.getCustomerId());

            for (PaymentAccounts c : cards) {
                c.setIsDefault(0);
            }

            paymentAccountRepo.saveAll(cards);
        }

        // Save card metadata ONLY (NO PAN, NO CVV)
        PaymentAccounts account = new PaymentAccounts();
        account.setCustomerId(user.getCustomerId());
        account.setHolderName(holderName);
        account.setMethod(stripeCard.getCard().getBrand());
        account.setLast4(stripeCard.getCard().getLast4());
        account.setStripePaymentMethodId(stripeCard.getId());
        account.setIsDefault(setDefault ? 1 : 0);
        account.setCreatedAt(LocalDateTime.now());

        account.setExpiryMonth(
                stripeCard.getCard().getExpMonth() != null
                        ? stripeCard.getCard().getExpMonth().intValue()
                        : null
        );

        account.setExpiryYear(
                stripeCard.getCard().getExpYear() != null
                        ? stripeCard.getCard().getExpYear().intValue()
                        : null
        );

        paymentAccountRepo.save(account);

        auditService.log(
                "PaymentMethod",
                "Add",
                "Customer " + user.getCustomerId() + " ****" + account.getLast4(),
                user.getUsername()
        );

        return ResponseEntity.ok(mapToDTO(account));
    }


    /**
     * Set default card (single endpoint only)
     */
    @PatchMapping("/default/{paymentMethodId}")
    @Transactional
    public ResponseEntity<Void> setDefaultCard(
            @PathVariable String paymentMethodId,
            Principal principal
    ) {

        UserAccount user = getUserFromPrincipal(principal);
        if (user == null) return ResponseEntity.status(401).build();

        List<PaymentAccounts> cards =
                paymentAccountRepo.findAllByCustomerIdOrderByCreatedAtDesc(user.getCustomerId());

        for (PaymentAccounts c : cards) {
            c.setIsDefault(
                    c.getStripePaymentMethodId().equals(paymentMethodId) ? 1 : 0
            );
        }

        paymentAccountRepo.saveAll(cards);

        return ResponseEntity.ok().build();
    }

    // ================= DELETE CARD =================
    @DeleteMapping("/{stripePaymentMethodId}")
    @Transactional
    public ResponseEntity<Void> deleteCard(
            @PathVariable String stripePaymentMethodId,
            Principal principal
    ) throws Exception {

        // =========================
        // Validate user
        // =========================
        UserAccount user = getUserFromPrincipal(principal);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        // =========================
        // Find card in DB
        // =========================
        Optional<PaymentAccounts> optCard = paymentAccountRepo
                .findAllByCustomerIdOrderByCreatedAtDesc(user.getCustomerId())
                .stream()
                .filter(c -> stripePaymentMethodId.equals(c.getStripePaymentMethodId()))
                .findFirst();

        if (optCard.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PaymentAccounts card = optCard.get();

        // =========================
        // Detach from Stripe
        // =========================
        stripeService.detachPaymentMethod(stripePaymentMethodId);

        // =========================
        // Remove from database
        // =========================
        paymentAccountRepo.delete(card);

        // =========================
        // Audit log
        // =========================
        auditService.log(
                "PaymentMethod",
                "Delete",
                "Customer " + user.getCustomerId() + " ****" + card.getLast4(),
                user.getUsername()
        );

        // =========================
        // Reassign default card if needed
        // =========================
        if (card.getIsDefault() == 1) {

            List<PaymentAccounts> remainingCards =
                    paymentAccountRepo.findAllByCustomerIdOrderByCreatedAtDesc(user.getCustomerId());

            if (!remainingCards.isEmpty()) {

                // Choose the most recent card as new default
                PaymentAccounts newDefault = remainingCards.get(0);

                newDefault.setIsDefault(1);

                paymentAccountRepo.save(newDefault);
            }
        }

        return ResponseEntity.ok().build();
    }


    // ================= HELPERS =================
    private UserAccount getUserFromPrincipal(Principal principal) {
        if (principal == null) return null;
        return userAccountRepo
                .findByUsernameIgnoreCase(principal.getName())
                .orElse(null);
    }

//    private BillingPaymentDTO mapToDTO(PaymentAccounts account) {
//        BillingPaymentDTO dto = new BillingPaymentDTO();
//        dto.setHolderName(account.getHolderName());
//        dto.setMethod(account.getMethod());
//        dto.setLast4(account.getLast4());
//        dto.setStripePaymentMethodId(account.getStripePaymentMethodId());
//        dto.setIsDefault(account.getIsDefault() == 1);
//        dto.setExpiryMonth(account.getExpiryMonth());
//        dto.setExpiryYear(account.getExpiryYear());
//        dto.setDisplayCard("**** **** **** " + account.getLast4());
//        return dto;
//    }
        private BillingPaymentDTO mapToDTO(PaymentAccounts account) {
            BillingPaymentDTO dto = new BillingPaymentDTO();
            dto.setHolderName(account.getHolderName());
            dto.setMethod(account.getMethod());
            dto.setLast4(account.getLast4());
            dto.setStripePaymentMethodId(account.getStripePaymentMethodId());
            dto.setIsDefault(account.getIsDefault() == 1);
            dto.setExpiryMonth(account.getExpiryMonth());
            dto.setExpiryYear(account.getExpiryYear());
            dto.setDisplayCard("**** **** **** " + account.getLast4());
            return dto;
        }
}