package org.example.service;

import jakarta.transaction.Transactional;
import org.example.dto.InvoiceDTO;
import org.example.dto.InvoiceRequestDTO;
import org.example.entity.Invoices;
import org.example.entity.PaymentAccounts;
import org.example.model.Customer;
import org.example.model.Subscription;
import org.example.model.SubscriptionAddOn;
import org.example.repository.*;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

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
    // INVOICE NUMBER
    // ======================================================
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

        invoice.setStatus("Pending");
        invoice.setSubtotal(body.getSubtotal() == null ? 0.0 : body.getSubtotal());
        invoice.setTaxTotal(body.getTaxTotal() == null ? 0.0 : body.getTaxTotal());
        invoice.setTotal(body.getTotal() == null ? 0.0 : body.getTotal());

        Invoices savedInvoice = invoiceRepository.save(invoice);

        // =========================
        // FIND PLAN ITEM
        // =========================
        Integer planId = body.getItems().stream()
                .filter(i -> i != null && "plan".equalsIgnoreCase(i.getType()))
                .map(i -> i.getId())
                .findFirst()
                .orElse(null);

        if (planId == null) {
            throw new IllegalArgumentException("Plan is required");
        }

        // =========================
        // CREATE SUBSCRIPTION
        // =========================
        Subscription subscription = new Subscription();
        subscription.setCustomerId(body.getCustomerId());
        subscription.setPlanId(planId);
        subscription.setStartDate(LocalDate.now());
        subscription.setStatus("Active");

        Subscription savedSubscription = subscriptionRepository.save(subscription);

        // =========================
        // ADDONS ONLY
        // =========================
        body.getItems().stream()
                .filter(i -> i != null && "addon".equalsIgnoreCase(i.getType()))
                .forEach(item -> {

                    SubscriptionAddOn addon = new SubscriptionAddOn();
                    addon.setSubscriptionId(savedSubscription.getSubscriptionId());
                    addon.setAddOnId(item.getId());
                    addon.setStartDate(LocalDate.now());
                    addon.setStatus("Active");

                    subscriptionAddOnRepository.save(addon);
                });

        // =========================
        // PAYMENT ACCOUNT
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
    // UPDATE
    // ======================================================
    public Invoices updateInvoice(String invoiceNumber, InvoiceRequestDTO body) {

        Invoices invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (invoice == null) return null;

        applyRequest(invoice, body);
        invoiceRepository.save(invoice);

        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }

    // ======================================================
    // DELETE
    // ======================================================
    public boolean deleteInvoice(String invoiceNumber) {

        Invoices invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (invoice == null) return false;

        invoiceRepository.delete(invoice);
        return true;
    }

    // ======================================================
    // APPLY UPDATE
    // ======================================================
    private void applyRequest(Invoices invoice, InvoiceRequestDTO body) {

        invoice.setCustomerId(body.getCustomerId());
        invoice.setStatus(body.getStatus());

        if (body.getInvoiceNumber() != null)
            invoice.setInvoiceNumber(body.getInvoiceNumber());

        if (body.getIssueDate() != null)
            invoice.setIssueDate(LocalDate.parse(body.getIssueDate()));

        if (body.getDueDate() != null)
            invoice.setDueDate(LocalDate.parse(body.getDueDate()));

        invoice.setSubtotal(body.getSubtotal() == null ? 0.0 : body.getSubtotal());
        invoice.setTaxTotal(body.getTaxTotal() == null ? 0.0 : body.getTaxTotal());
        invoice.setTotal(body.getTotal() == null ? 0.0 : body.getTotal());
    }

    // ======================================================
    // DTO CONVERT
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

        // customer name
        Customer customer = invoice.getCustomerId() != null
                ? customerRepository.findById(invoice.getCustomerId()).orElse(null)
                : null;

        dto.setCustomerName(customer == null ? "—" :
                ("Business".equalsIgnoreCase(customer.getCustomerType())
                        ? customer.getBusinessName()
                        : customer.getFirstName() + " " + customer.getLastName())
        );

        // payment
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
    // REQUIRED METHODS (FIXED)
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