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

    public BillingPaymentController(UserAccountRepository userAccountRepo,
                                    PaymentAccountRepository paymentAccountRepo,
                                    StripePaymentService stripeService,
                                    AuditService auditService) {
        this.userAccountRepo = userAccountRepo;
        this.paymentAccountRepo = paymentAccountRepo;
        this.stripeService = stripeService;
        this.auditService = auditService;
    }

    // ================= GET ALL CARDS =================
    // Supports both /api/billing/payment and /api/billing/payment/all
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
    @PostMapping("/stripe")
    @Transactional
    public ResponseEntity<BillingPaymentDTO> addCard(@RequestBody Map<String, Object> body,
                                                     Principal principal) throws Exception {
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
        if (stripeCustomerId == null) {
            stripeCustomerId = stripeService.createCustomer(user.getUsername());
            user.setStripeCustomerId(stripeCustomerId);
            userAccountRepo.save(user);
        }

        // Attach card to Stripe
        PaymentMethod stripeCard = stripeService.attachPaymentMethodToCustomer(stripeCustomerId, paymentMethodId);

        PaymentAccounts account = new PaymentAccounts();
        account.setCustomerId(user.getCustomerId());
        account.setHolderName(holderName);
        account.setMethod(stripeCard.getCard().getBrand());
        account.setLast4(stripeCard.getCard().getLast4());
        account.setStripePaymentMethodId(stripeCard.getId());
        account.setCreatedAt(LocalDateTime.now());
        account.setIsDefault(setDefault ? 1 : 0);
        account.setExpiryMonth(stripeCard.getCard().getExpMonth() != null ? stripeCard.getCard().getExpMonth().intValue() : null);
        account.setExpiryYear(stripeCard.getCard().getExpYear() != null ? stripeCard.getCard().getExpYear().intValue() : null);

        // Clear previous defaults if setting this as default
        if (setDefault) {
            List<PaymentAccounts> existing = paymentAccountRepo
                    .findAllByCustomerIdOrderByCreatedAtDesc(user.getCustomerId());
            for (PaymentAccounts c : existing) {
                c.setIsDefault(0);
                paymentAccountRepo.save(c);
            }
        }

        paymentAccountRepo.save(account);

        // Audit log
        auditService.log("PaymentMethod", "Add",
                "Customer " + user.getCustomerId() + " ••••" + account.getLast4(),
                user.getUsername());

        return ResponseEntity.ok(mapToDTO(account));
    }

    // ================= DELETE CARD =================
    @DeleteMapping("/{stripePaymentMethodId}")
    @Transactional
    public ResponseEntity<Void> deleteCard(@PathVariable String stripePaymentMethodId,
                                           Principal principal) throws Exception {
        UserAccount user = getUserFromPrincipal(principal);
        if (user == null) return ResponseEntity.status(401).build();

        Optional<PaymentAccounts> optCard = paymentAccountRepo
                .findAllByCustomerIdOrderByCreatedAtDesc(user.getCustomerId())
                .stream()
                .filter(c -> stripePaymentMethodId.equals(c.getStripePaymentMethodId()))
                .findFirst();

        if (optCard.isEmpty()) return ResponseEntity.notFound().build();

        PaymentAccounts card = optCard.get();

        // Detach card from Stripe
        stripeService.detachPaymentMethod(stripePaymentMethodId);

        // Delete from DB
        paymentAccountRepo.delete(card);

        // Audit log
        auditService.log("PaymentMethod", "Delete",
                "Customer " + user.getCustomerId() + " ••••" + card.getLast4(),
                user.getUsername());

        // If deleted card was default, set first remaining card as default
        if (card.getIsDefault() == 1) {
            List<PaymentAccounts> remaining = paymentAccountRepo
                    .findAllByCustomerIdOrderByCreatedAtDesc(user.getCustomerId());
            if (!remaining.isEmpty()) {
                PaymentAccounts first = remaining.get(0);
                first.setIsDefault(1);
                paymentAccountRepo.save(first);
            }
        }

        return ResponseEntity.ok().build();
    }

    // ================= SET DEFAULT CARD =================
    @PatchMapping("/default/{stripePaymentMethodId}")
    @Transactional
    public ResponseEntity<Void> setDefaultCard(@PathVariable String stripePaymentMethodId,
                                               Principal principal) {
        UserAccount user = getUserFromPrincipal(principal);
        if (user == null) return ResponseEntity.status(401).build();

        List<PaymentAccounts> cards = paymentAccountRepo
                .findAllByCustomerIdOrderByCreatedAtDesc(user.getCustomerId());

        for (PaymentAccounts c : cards) {
            c.setIsDefault(c.getStripePaymentMethodId().equals(stripePaymentMethodId) ? 1 : 0);
            paymentAccountRepo.save(c);
        }

        return ResponseEntity.ok().build();
    }

    // ================= HELPER METHODS =================
    private UserAccount getUserFromPrincipal(Principal principal) {
        if (principal == null) return null;
        return userAccountRepo.findByUsernameIgnoreCase(principal.getName()).orElse(null);
    }

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