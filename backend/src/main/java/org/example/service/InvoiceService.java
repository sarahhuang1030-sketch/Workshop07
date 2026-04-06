package org.example.service;

import jakarta.transaction.Transactional;
import org.example.dto.InvoiceDTO;
import org.example.dto.InvoiceRequestDTO;
import org.example.dto.ItemDTO;
import org.example.entity.Invoices;
import org.example.entity.PaymentAccounts;
import org.example.entity.Quote;
import org.example.model.Customer;
import org.example.model.Subscription;
import org.example.model.SubscriptionAddOn;
import org.example.repository.*;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * SaaS Invoice Service
 * Supports:
 * - Quote → Invoice conversion
 * - Subscription creation
 * - Add-ons binding
 * - Status lifecycle: PENDING → APPROVED → PAID
 */
@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final PaymentAccountRepository paymentAccountRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionAddOnRepository subscriptionAddOnRepository;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            CustomerRepository customerRepository,
            PaymentAccountRepository paymentAccountRepository,
            SubscriptionRepository subscriptionRepository,
            SubscriptionAddOnRepository subscriptionAddOnRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
        this.paymentAccountRepository = paymentAccountRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.subscriptionAddOnRepository = subscriptionAddOnRepository;
    }

    // ======================================================
    // SaaS STATUS LIFECYCLE
    // ======================================================
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_PAID = "PAID";

    private String generateInvoiceNumber() {
        return "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ======================================================
    // CREATE INVOICE (PLAN + ADDON + SUBSCRIPTION)
    // ======================================================
    @Transactional
    public Invoices createInvoice(InvoiceRequestDTO body) {

        if (body.getItems() == null) {
            body.setItems(List.of());
        }

        Invoices invoice = new Invoices();
        invoice.setCustomerId(body.getCustomerId());

        invoice.setInvoiceNumber(
                (body.getInvoiceNumber() == null || body.getInvoiceNumber().isBlank())
                        ? generateInvoiceNumber()
                        : body.getInvoiceNumber()
        );

        invoice.setStatus(STATUS_PENDING);

        invoice.setSubtotal(body.getSubtotal() == null ? 0.0 : body.getSubtotal());
        invoice.setTaxTotal(body.getTaxTotal() == null ? 0.0 : body.getTaxTotal());
        invoice.setTotal(body.getTotal() == null ? 0.0 : body.getTotal());

        Invoices savedInvoice = invoiceRepository.save(invoice);

        // =========================
        // PLAN ITEM (REQUIRED)
        // =========================
        Integer planId = body.getItems().stream()
                .filter(i -> i != null && "plan".equalsIgnoreCase(i.getType()))
                .map(ItemDTO::getId)
                .findFirst()
                .orElse(null);

        if (planId == null) {
            throw new IllegalArgumentException("Plan is required in invoice items");
        }

        // =========================
        // CREATE SUBSCRIPTION
        // =========================
        Subscription subscription = new Subscription();
        subscription.setCustomerId(body.getCustomerId());
        subscription.setPlanId(planId);
        subscription.setStartDate(LocalDate.now());
        subscription.setStatus("ACTIVE");

        Subscription savedSubscription = subscriptionRepository.save(subscription);

        // =========================
        // ADDONS
        // =========================
        body.getItems().stream()
                .filter(i -> i != null && "addon".equalsIgnoreCase(i.getType()))
                .forEach(item -> {

                    SubscriptionAddOn addon = new SubscriptionAddOn();
                    addon.setSubscriptionId(savedSubscription.getSubscriptionId());
                    addon.setAddOnId(item.getId());
                    addon.setStartDate(LocalDate.now());
                    addon.setStatus("ACTIVE");

                    subscriptionAddOnRepository.save(addon);
                });

        // =========================
        // PAYMENT ACCOUNT LINK
        // =========================
        if (body.getPaymentAccountId() != null) {
            paymentAccountRepository.findById(body.getPaymentAccountId())
                    .ifPresent(account -> {
                        savedInvoice.setPaidByAccount(account);
                        invoiceRepository.save(savedInvoice);
                    });
        }

        return savedInvoice;
    }

    // ======================================================
    // CREATE FROM QUOTE
    // ======================================================
    @Transactional
    public Invoices createFromQuote(Quote q) {

        Invoices inv = new Invoices();

        inv.setCustomerId(q.getCustomerId());
        inv.setSubtotal(q.getAmount());
        inv.setTotal(q.getAmount());
        inv.setTaxTotal(0.0);

        inv.setInvoiceNumber(generateInvoiceNumber());
        inv.setStatus(STATUS_PENDING);

        try {
            inv.setQuoteId(q.getId());
        } catch (Exception ignored) {}

        return invoiceRepository.save(inv);
    }

    // ======================================================
    // UPDATE INVOICE
    // ======================================================
    @Transactional
    public Invoices updateInvoice(String invoiceNumber, InvoiceRequestDTO body) {

        Invoices inv = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (inv == null) return null;

        // Only allow update in PENDING state
        if (!STATUS_PENDING.equals(inv.getStatus())) {
            throw new IllegalStateException("Only PENDING invoices can be updated");
        }

        inv.setSubtotal(body.getSubtotal());
        inv.setTaxTotal(body.getTaxTotal());
        inv.setTotal(body.getTotal());

        if (body.getPaymentAccountId() != null) {
            paymentAccountRepository.findById(body.getPaymentAccountId())
                    .ifPresent(inv::setPaidByAccount);
        }

        return invoiceRepository.save(inv);
    }

    // ======================================================
    // DELETE INVOICE (SAFE VERSION)
    // ======================================================
        @Transactional
        public boolean deleteInvoice(String invoiceNumber) {

            Invoices inv = invoiceRepository.findByInvoiceNumber(invoiceNumber);

            if (inv == null) {
                return false;
            }

            // SaaS safety rule:
            // Do not delete PAID invoices
            if (STATUS_PAID.equals(inv.getStatus())) {
                throw new IllegalStateException("Cannot delete PAID invoices");
            }

            // Option A: HARD DELETE
            invoiceRepository.delete(inv);

            return true;
        }
    // ======================================================
    // APPROVE INVOICE
    // ======================================================
    public Invoices approveInvoice(String invoiceNumber) {

        Invoices inv = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (inv == null) return null;

        if (!STATUS_PENDING.equals(inv.getStatus())) {
            throw new IllegalStateException("Only PENDING invoices can be approved");
        }

        inv.setStatus(STATUS_APPROVED);
        return invoiceRepository.save(inv);
    }

    // ======================================================
    // MARK AS PAID
    // ======================================================
    public Invoices markAsPaid(String invoiceNumber, Integer paymentAccountId) {

        Invoices inv = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (inv == null) return null;

        if (!STATUS_APPROVED.equals(inv.getStatus())) {
            throw new IllegalStateException("Invoice must be APPROVED before payment");
        }

        if (paymentAccountId != null) {
            paymentAccountRepository.findById(paymentAccountId)
                    .ifPresent(inv::setPaidByAccount);
        }

        inv.setStatus(STATUS_PAID);

        return invoiceRepository.save(inv);
    }

    // ======================================================
    // DTO CONVERSION
    // ======================================================
    public InvoiceDTO convertToDTO(Invoices invoice) {

        InvoiceDTO dto = new InvoiceDTO();

        dto.invoiceNumber = invoice.getInvoiceNumber();
        dto.status = invoice.getStatus();

        dto.issueDate = invoice.getIssueDate() != null ? invoice.getIssueDate().toString() : null;
        dto.dueDate = invoice.getDueDate() != null ? invoice.getDueDate().toString() : null;

        dto.subtotal = BigDecimal.valueOf(invoice.getSubtotal() == null ? 0.0 : invoice.getSubtotal());
        dto.taxTotal = BigDecimal.valueOf(invoice.getTaxTotal() == null ? 0.0 : invoice.getTaxTotal());
        dto.total = BigDecimal.valueOf(invoice.getTotal() == null ? 0.0 : invoice.getTotal());

        Customer customer = invoice.getCustomerId() != null
                ? customerRepository.findById(invoice.getCustomerId()).orElse(null)
                : null;

        dto.setCustomerName(customer == null ? "—" :
                ("Business".equalsIgnoreCase(customer.getCustomerType())
                        ? customer.getBusinessName()
                        : customer.getFirstName() + " " + customer.getLastName())
        );

        PaymentAccounts account = invoice.getPaidByAccount();

        InvoiceDTO.PaymentAccountDTO paid = new InvoiceDTO.PaymentAccountDTO();
        if (account != null) {
            paid.setMethod(account.getMethod());
            paid.setLast4(account.getLast4());
            paid.setAccountId(account.getAccountId());
        } else {
            paid.setMethod("Online Payment");
        }

        dto.paidByAccount = paid;

        return dto;
    }

    // ======================================================
    // FINDERS
    // ======================================================
    public List<Invoices> findAllInvoices() {
        return invoiceRepository.findAll();
    }

    public List<Invoices> findAllByCustomerId(Integer customerId) {
        return invoiceRepository.findByCustomerIdOrderByIssueDateDesc(customerId);
    }

    public Invoices findByInvoiceNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }

    public Invoices findLatestByCustomerId(Integer customerId) {
        return invoiceRepository.findTopByCustomerIdOrderByIssueDateDesc(customerId);
    }
}