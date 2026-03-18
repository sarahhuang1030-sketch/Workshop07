package org.example.service;

import com.stripe.model.PaymentIntent;
import org.example.entity.InvoiceItems;
import org.example.entity.Invoices;
import org.example.entity.PaymentAccounts;
import org.example.model.UserAccount;
import org.example.repository.InvoiceItemRepository;
import org.example.repository.InvoiceRepository;
import org.example.repository.PaymentAccountRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.example.dto.CheckoutItemDTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

// Service responsible for handling checkout process
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

//     * Checkout flow
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

        PaymentIntent intent =
                stripePaymentService.retrievePaymentIntent(paymentIntentId);

        if (!"succeeded".equals(intent.getStatus())) {
            throw new Exception("Payment not completed");
        }

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        String username = auth.getName();

        UserAccount user = userRepo
                .findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new Exception("User not found"));

        Integer customerId = user.getCustomerId();

        PaymentAccounts account = accountRepo
                .findByAccountIdAndCustomerId(paymentAccountId, customerId)
                .orElseThrow(() -> new Exception("Invalid payment account"));

        Double amountToCharge = total;

        if ("monthly".equalsIgnoreCase(billingCycle)) {
            amountToCharge = 0.0;
        }

        if (account.getBalance() < amountToCharge) {
            throw new Exception("Insufficient balance");
        }

        account.setBalance(account.getBalance() - amountToCharge);
        accountRepo.save(account);

        Invoices invoices = new Invoices();

        invoices.setInvoiceNumber("TC-" + System.currentTimeMillis());
        invoices.setCustomerId(customerId);
        invoices.setIssueDate(LocalDate.now());
        invoices.setDueDate(LocalDate.now());

        invoices.setSubtotal(subtotal);
        invoices.setTaxTotal(tax);
        invoices.setTotal(total);

        invoices.setPromoCode(promoCode);
        invoices.setPaidByAccount(account);
        invoices.setStatus("PAID");

        // Store Stripe reference
        invoices.setStripePaymentIntentId(paymentIntentId);

        Invoices savedInvoices = invoiceRepo.save(invoices);

        for (CheckoutItemDTO dto : items) {

            // Create new Entity object
            InvoiceItems item = new InvoiceItems();

            // Link to parent invoice
            item.setInvoice(savedInvoices);

            // Map basic fields
            item.setDescription(dto.getDescription());
            item.setQuantity(dto.getQuantity());

            // Convert Double → BigDecimal
            item.setUnitPrice(
                    BigDecimal.valueOf(dto.getUnitPrice())
            );

            // Handle line total
            if (dto.getLineTotal() != null) {
                item.setLineTotal(
                        BigDecimal.valueOf(dto.getLineTotal())
                );
            } else {
                item.setLineTotal(
                        BigDecimal.valueOf(
                                dto.getQuantity() * dto.getUnitPrice()
                        )
                );
            }

            // Optional discount
            if (dto.getDiscountAmount() != null) {
                item.setDiscountAmount(
                        BigDecimal.valueOf(dto.getDiscountAmount())
                );
            }

            // Save to DB
            itemRepo.save(item);
        }

        return savedInvoices;
    }
}