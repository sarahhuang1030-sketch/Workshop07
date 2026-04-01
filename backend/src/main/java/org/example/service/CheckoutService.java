package org.example.service;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import org.example.entity.InvoiceItems;
import org.example.entity.Invoices;
import org.example.entity.PaymentAccounts;
import org.example.model.UserAccount;
import org.example.repository.InvoiceItemRepository;
import org.example.repository.InvoiceRepository;
import org.example.repository.PaymentAccountRepository;
import org.example.repository.UserAccountRepository;
import org.example.dto.CheckoutItemDTO;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class CheckoutService {

    private final InvoiceRepository invoiceRepo;
    private final InvoiceItemRepository itemRepo;
    private final PaymentAccountRepository accountRepo;
    private final UserAccountRepository userRepo;
    private final StripePaymentService stripePaymentService;

    public CheckoutService(
            InvoiceRepository invoiceRepo,
            InvoiceItemRepository itemRepo,
            PaymentAccountRepository accountRepo,
            UserAccountRepository userRepo,
            StripePaymentService stripePaymentService
    ) {
        this.invoiceRepo = invoiceRepo;
        this.itemRepo = itemRepo;
        this.accountRepo = accountRepo;
        this.userRepo = userRepo;
        this.stripePaymentService = stripePaymentService;
    }

//    @Transactional
//    public Invoices checkout(
//            Integer paymentAccountId,
//            Double subtotal,
//            Double tax,
//            Double total,
//            String promoCode,
//            String billingCycle,
//            String paymentIntentId,
//            List<CheckoutItemDTO> items
//    ) throws Exception {
//
//        System.out.println("[DEBUG] ===== Checkout Request Start =====");
//        System.out.println("[DEBUG] paymentAccountId: " + paymentAccountId);
//        System.out.println("[DEBUG] subtotal: " + subtotal + ", tax: " + tax + ", total: " + total);
//        System.out.println("[DEBUG] promoCode: " + promoCode + ", billingCycle: " + billingCycle);
//        System.out.println("[DEBUG] paymentIntentId: " + paymentIntentId);
//        System.out.println("[DEBUG] items:");
//        for (CheckoutItemDTO dto : items) {
//            System.out.println("  - desc=" + dto.getDescription() + ", qty=" + dto.getQuantity()
//                    + ", unitPrice=" + dto.getUnitPrice()
//                    + ", lineTotal=" + dto.getLineTotal()
//                    + ", discount=" + dto.getDiscountAmount());
//        }
//
//        // -------------------------
//        // 1. Verify Stripe payment succeeded
//        // -------------------------
//        PaymentIntent intent = stripePaymentService.retrievePaymentIntent(paymentIntentId);
//        if (!"succeeded".equals(intent.getStatus())) {
//            throw new Exception("Payment not completed");
//        }
//
//        // -------------------------
//        // 2. Retrieve user
//        // -------------------------
//        String username = SecurityContextHolder.getContext().getAuthentication().getName();
//        UserAccount user = userRepo.findByUsernameIgnoreCase(username)
//                .orElseThrow(() -> new Exception("User not found"));
//        System.out.println("[DEBUG] Username: " + username + ", customerId=" + user.getCustomerId());
//
//        // -------------------------
//        // 3. Retrieve PaymentAccount
//        // -------------------------
//        PaymentAccounts account = null;
//        if (paymentAccountId != null && paymentAccountId > 0) {
//            account = accountRepo
//                    .findByAccountIdAndCustomerId(paymentAccountId, user.getCustomerId())
//                    .orElse(null);
//
//            if (account != null) {
//                System.out.println("[DEBUG] Found PaymentAccount: AccountId=" + account.getAccountId()
//                        + ", last4=" + account.getLast4()
//                        + ", method=" + account.getMethod());
//            } else {
//                System.out.println("[DEBUG] No PaymentAccount found for AccountId=" + paymentAccountId
//                        + ", customerId=" + user.getCustomerId());
//            }
//        } else {
//            System.out.println("[DEBUG] Using temporary card (no saved account)");
//        }
//
//        // -------------------------
//        // 4. Create Invoice entity
//        // -------------------------
//        Invoices invoice = new Invoices();
//        invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
//        invoice.setCustomerId(user.getCustomerId());
//        invoice.setIssueDate(LocalDate.now());
//        invoice.setDueDate(LocalDate.now().plusDays(7));
//        invoice.setSubtotal(subtotal);
//        invoice.setTaxTotal(tax);
//        invoice.setTotal(total);
//        invoice.setPromoCode(promoCode);
//        invoice.setPaidByAccount(account); // can be null for temporary card
//        invoice.setStatus("PAID");
//        invoice.setStripePaymentIntentId(paymentIntentId);
//
//        Invoices savedInvoice = invoiceRepo.save(invoice);
//
//        // -------------------------
//        // 5. Save each checkout item
//        // -------------------------
//        for (CheckoutItemDTO dto : items) {
//            InvoiceItems item = new InvoiceItems();
//            item.setInvoice(savedInvoice);
//            item.setDescription(dto.getDescription());
//            item.setQuantity(dto.getQuantity());
//            item.setUnitPrice(BigDecimal.valueOf(dto.getUnitPrice()));
//            item.setLineTotal(BigDecimal.valueOf(
//                    dto.getLineTotal() != null ? dto.getLineTotal() : dto.getQuantity() * dto.getUnitPrice()
//            ));
//            item.setDiscountAmount(dto.getDiscountAmount() != null
//                    ? BigDecimal.valueOf(dto.getDiscountAmount())
//                    : BigDecimal.ZERO);
//            itemRepo.save(item);
//        }
//
//        System.out.println("[DEBUG] ===== Checkout Request End =====");
//
//        return savedInvoice;
//    }

    @Transactional
    public Invoices checkout(
            Integer paymentAccountId,
            Double subtotal,
            Double tax,
            Double total,
            String promoCode,
            String billingCycle,
            String paymentIntentId,
            List<CheckoutItemDTO> items
    ) throws Exception {

        // 1. Verify Stripe payment success
        PaymentIntent intent = stripePaymentService.retrievePaymentIntent(paymentIntentId);

        if (!"succeeded".equals(intent.getStatus())) {
            throw new Exception("Payment not completed");
        }

        // 2. Get user
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount user = userRepo.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new Exception("User not found"));

        // 3. Resolve payment account (optional)
        PaymentAccounts account = null;

        if (paymentAccountId != null) {
            account = accountRepo.findById(paymentAccountId).orElse(null);
        }

        // 4. Create invoice
        Invoices invoice = new Invoices();
        invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
        invoice.setCustomerId(user.getCustomerId());
        invoice.setIssueDate(LocalDate.now());
        invoice.setDueDate(LocalDate.now().plusDays(7));
        invoice.setSubtotal(subtotal);
        invoice.setTaxTotal(tax);
        invoice.setTotal(total);
        invoice.setPromoCode(promoCode);
        invoice.setStatus("PAID");
        invoice.setPaidByAccount(account);
        invoice.setStripePaymentIntentId(paymentIntentId);

        Invoices saved = invoiceRepo.save(invoice);

        // 5. Save items
        for (CheckoutItemDTO dto : items) {
            InvoiceItems item = new InvoiceItems();
            item.setInvoice(saved);
            item.setDescription(dto.getDescription());
            item.setQuantity(dto.getQuantity());
            item.setUnitPrice(BigDecimal.valueOf(dto.getUnitPrice()));
            item.setLineTotal(BigDecimal.valueOf(dto.getLineTotal()));
            item.setDiscountAmount(BigDecimal.ZERO);
            itemRepo.save(item);
        }

        return saved;
    }
}