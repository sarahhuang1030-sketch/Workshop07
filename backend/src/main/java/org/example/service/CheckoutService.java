package org.example.service;

import org.example.entity.Invoices;
import org.example.entity.InvoiceItems;
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

@Service
public class CheckoutService {

    private final InvoiceRepository invoiceRepo;
    private final InvoiceItemRepository itemRepo;
    private final PaymentAccountRepository accountRepo;
    private final UserAccountRepository userRepo;

    public CheckoutService(InvoiceRepository invoiceRepo,
                           InvoiceItemRepository itemRepo,
                           PaymentAccountRepository accountRepo,
                           UserAccountRepository userRepo) {
        this.invoiceRepo = invoiceRepo;
        this.itemRepo = itemRepo;
        this.accountRepo = accountRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public Invoices checkout(Integer paymentAccountId,
                             Double subtotal,
                             Double tax,
                             Double total,
                             String promoCode,
                             String billingCycle,
                             List<InvoiceItems> items) throws Exception {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        UserAccount user = userRepo.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new Exception("User not found"));

        Integer customerId = user.getCustomerId();

        Double amountToCharge = total;
        if ("monthly".equalsIgnoreCase(billingCycle)) amountToCharge = 0.0;

        PaymentAccounts account = accountRepo
                .findByAccountIdAndCustomerId(paymentAccountId, customerId)
                .orElseThrow(() -> new Exception("Invalid payment account"));

        if (account.getBalance() < amountToCharge) throw new Exception("Insufficient balance");

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

        Invoices savedInvoices = invoiceRepo.save(invoices);

        // Save invoice items
        for (InvoiceItems item : items) {
            item.setInvoice(savedInvoices);
            if (item.getLineTotal() == null) {
                item.setLineTotal(BigDecimal.valueOf(item.getQuantity() * item.getUnitPrice().doubleValue()));
            }
            itemRepo.save(item);
        }

        return savedInvoices;
    }
}