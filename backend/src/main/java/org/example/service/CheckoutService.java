package org.example.service;

import org.example.dto.CheckoutItemDTO;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.stripe.model.PaymentIntent;

@Service
public class CheckoutService {

    private final InvoiceRepository invoiceRepo;
    private final InvoiceItemRepository itemRepo;
    private final PaymentAccountRepository accountRepo;
    private final UserAccountRepository userRepo;
    private final StripePaymentService stripePaymentService;

    public CheckoutService(InvoiceRepository invoiceRepo,
                           InvoiceItemRepository itemRepo,
                           PaymentAccountRepository accountRepo,
                           UserAccountRepository userRepo,
                           StripePaymentService stripePaymentService) {
        this.invoiceRepo = invoiceRepo;
        this.itemRepo = itemRepo;
        this.accountRepo = accountRepo;
        this.userRepo = userRepo;
        this.stripePaymentService = stripePaymentService;
    }

    /**
     * Checkout: validate PaymentIntent and create invoice + invoice items
     */
    @Transactional
    public Invoices checkout(
            Integer paymentAccountId,
            Double subtotal,
            Double tax,
            Double total,
            String promoCode,
            String billingCycle,
            String paymentIntentId,
            List<CheckoutItemDTO> items) throws Exception {

        // --- Stripe payment validation ---
        PaymentIntent intent = stripePaymentService.retrievePaymentIntent(paymentIntentId);
        if (!"succeeded".equals(intent.getStatus())) {
            throw new Exception("Payment not completed");
        }

        // --- Get logged-in user ---
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        UserAccount user = userRepo.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new Exception("User not found"));
        Integer customerId = user.getCustomerId();

        // --- Validate payment account ---
        PaymentAccounts account = accountRepo
                .findByAccountIdAndCustomerId(paymentAccountId, customerId)
                .orElseThrow(() -> new Exception("Invalid payment account"));

        // Deduct from balance if needed
        Double amountToCharge = total;
        if ("monthly".equalsIgnoreCase(billingCycle)) amountToCharge = 0.0;

        if (account.getBalance() < amountToCharge)
            throw new Exception("Insufficient balance");

        account.setBalance(account.getBalance() - amountToCharge);
        accountRepo.save(account);

        // --- Create Invoice ---
        Invoices invoices = new Invoices();
        invoices.setInvoiceNumber("TC-" + System.currentTimeMillis());
        invoices.setCustomerId(customerId);
        invoices.setIssueDate(LocalDate.now());
        invoices.setDueDate(LocalDate.now());
        invoices.setSubtotal(subtotal != null ? subtotal : 0.0);
        invoices.setTaxTotal(tax != null ? tax : 0.0);
        invoices.setTotal(total != null ? total : 0.0);
        invoices.setPromoCode(promoCode != null ? promoCode : "");
        invoices.setPaidByAccount(account);
        invoices.setStatus("PAID");
        invoices.setStripePaymentIntentId(paymentIntentId);

        Invoices savedInvoices;
        try {
            savedInvoices = invoiceRepo.save(invoices);
        } catch (Exception e) {
            e.printStackTrace();
            throw new Exception("Failed to save invoice: " + e.getMessage());
        }

        // --- Save invoice items safely ---
        if (items != null) {
            for (CheckoutItemDTO dtoItem : items) {
                InvoiceItems item = new InvoiceItems();
                item.setInvoice(savedInvoices);
                item.setDescription(dtoItem.getDescription() != null ? dtoItem.getDescription() : "N/A");

                int qty = dtoItem.getQuantity() != null ? dtoItem.getQuantity() : 1;
                item.setQuantity(qty);

                double unitPrice = dtoItem.getUnitPrice() != null ? dtoItem.getUnitPrice() : 0.0;
                item.setUnitPrice(BigDecimal.valueOf(unitPrice));

                double lineTotal = dtoItem.getLineTotal() != null ? dtoItem.getLineTotal() : qty * unitPrice;
                item.setLineTotal(BigDecimal.valueOf(lineTotal));

                double discount = dtoItem.getDiscountAmount() != null ? dtoItem.getDiscountAmount() : 0.0;
                item.setDiscountAmount(BigDecimal.valueOf(discount));

                try {
                    itemRepo.save(item);
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new Exception("Failed to save invoice item: " + e.getMessage());
                }
            }
        }

        return savedInvoices;
    }
}