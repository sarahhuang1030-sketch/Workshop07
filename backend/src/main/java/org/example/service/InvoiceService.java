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
import org.example.entity.InvoiceItems;
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
    private final InvoiceItemRepository invoiceItemRepository;
    private final PlanRepository planRepository;
    private final AddOnRepository addOnRepository;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            CustomerRepository customerRepository,
            PaymentAccountRepository paymentAccountRepository,
            SubscriptionRepository subscriptionRepository,
            SubscriptionAddOnRepository subscriptionAddOnRepository,
            InvoiceItemRepository invoiceItemRepository,
            PlanRepository planRepository,
            AddOnRepository addOnRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
        this.paymentAccountRepository = paymentAccountRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.subscriptionAddOnRepository = subscriptionAddOnRepository;
        this.invoiceItemRepository = invoiceItemRepository;
        this.planRepository = planRepository;
        this.addOnRepository = addOnRepository;
    }

    // =========================
    // STATUS
    // =========================
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_PAID = "PAID";

    private String generateInvoiceNumber() {
        return "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // =========================
    // CREATE INVOICE
    // =========================
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

        // plan required
        Integer planId = body.getItems().stream()
                .filter(i -> i != null && "plan".equalsIgnoreCase(i.getType()))
                .map(ItemDTO::getId)
                .findFirst()
                .orElse(null);

        if (planId == null) {
            throw new IllegalArgumentException("Plan is required in invoice items");
        }

        // items
        for (ItemDTO item : body.getItems()) {

            if (item == null) continue;

            InvoiceItems entity = new InvoiceItems();
            entity.setInvoice(savedInvoice);
            entity.setDescription(item.getName());
            entity.setQuantity(item.getQuantity() == null ? 1 : item.getQuantity());
            entity.setItemType(item.getType());
            entity.setServiceType(item.getServiceType());

            if (item.getPrice() != null) {
                entity.setUnitPrice(BigDecimal.valueOf(item.getPrice()));
                entity.setLineTotal(
                        BigDecimal.valueOf(item.getPrice())
                                .multiply(BigDecimal.valueOf(entity.getQuantity()))
                );
            }

            entity.setDiscountAmount(BigDecimal.ZERO);
            invoiceItemRepository.save(entity);
        }

        // subscription
        Subscription subscription = new Subscription();
        subscription.setCustomerId(body.getCustomerId());
        subscription.setPlanId(planId);
        subscription.setStartDate(LocalDate.now());
        subscription.setStatus("ACTIVE");

        Subscription savedSubscription = subscriptionRepository.save(subscription);

        // addons
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

        // payment account
        if (body.getPaymentAccountId() != null) {
            paymentAccountRepository.findById(body.getPaymentAccountId())
                    .ifPresent(account -> {
                        savedInvoice.setPaidByAccount(account);
                        invoiceRepository.save(savedInvoice);
                    });
        }

        return savedInvoice;
    }

    // =========================
    // CREATE FROM QUOTE
    // =========================
    @Transactional
    public Invoices createFromQuote(Quote q) {

        Invoices inv = new Invoices();
        inv.setCustomerId(q.getCustomerId());
        inv.setSubtotal(q.getAmount());
        inv.setTotal(q.getAmount());
        inv.setTaxTotal(0.0);
        inv.setInvoiceNumber(generateInvoiceNumber());
        inv.setStatus(STATUS_PENDING);
        inv.setSource("QUOTE");
        inv.setIssueDate(LocalDate.now());

        try {
            inv.setQuoteId(q.getId());
        } catch (Exception ignored) {}

        Invoices saved = invoiceRepository.save(inv);

        return saved;
    }

    // =========================
    // UPDATE
    // =========================
    @Transactional
    public Invoices updateInvoice(String invoiceNumber, InvoiceRequestDTO body) {

        Invoices inv = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (inv == null) return null;

        if (!STATUS_PENDING.equals(inv.getStatus())) {
            throw new IllegalStateException("Only PENDING invoices can be updated");
        }

        inv.setSubtotal(body.getSubtotal());
        inv.setTaxTotal(body.getTaxTotal());
        inv.setTotal(body.getTotal());

        return invoiceRepository.save(inv);
    }

    // =========================
    // DELETE
    // =========================
    @Transactional
    public boolean deleteInvoice(String invoiceNumber) {

        Invoices inv = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (inv == null) return false;

        if (STATUS_PAID.equals(inv.getStatus())) {
            throw new IllegalStateException("Cannot delete PAID invoices");
        }

        invoiceRepository.delete(inv);
        return true;
    }

    // =========================
    // APPROVE
    // =========================
    public Invoices approveInvoice(String invoiceNumber) {

        Invoices inv = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (inv == null) return null;

        if (!STATUS_PENDING.equals(inv.getStatus())) {
            throw new IllegalStateException("Only PENDING invoices can be approved");
        }

        inv.setStatus(STATUS_APPROVED);
        return invoiceRepository.save(inv);
    }

    // =========================
    // MARK PAID
    // =========================
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

    // =========================
    // DTO
    // =========================
    public InvoiceDTO convertToDTO(Invoices invoice) {

        InvoiceDTO dto = new InvoiceDTO();

        dto.invoiceNumber = invoice.getInvoiceNumber();
        dto.status = invoice.getStatus();

        dto.issueDate = invoice.getIssueDate() != null ? invoice.getIssueDate().toString() : null;
        dto.dueDate = invoice.getDueDate() != null ? invoice.getDueDate().toString() : null;

        if (invoice.getSubscriptionId() != null) {
            subscriptionRepository.findById(invoice.getSubscriptionId()).ifPresent(sub -> {
                dto.startDate = sub.getStartDate() != null ? sub.getStartDate().toString() : null;
                dto.endDate = sub.getEndDate() != null ? sub.getEndDate().toString() : null;
            });
        }

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

        dto.items = invoiceItemRepository.findByInvoice_InvoiceId(invoice.getInvoiceId())
                .stream()
                .map(i -> {
                    InvoiceDTO.InvoiceItemDTO itemDTO = new InvoiceDTO.InvoiceItemDTO();
                    itemDTO.description = i.getDescription();
                    itemDTO.quantity = i.getQuantity();
                    itemDTO.unitPrice = i.getUnitPrice();
                    itemDTO.discountAmount = i.getDiscountAmount();
                    itemDTO.lineTotal = i.getLineTotal();
                    itemDTO.itemType = i.getItemType();
                    itemDTO.serviceType = i.getServiceType();
                    return itemDTO;
                })
                .toList();

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

    // =========================
    // FINDERS
    // =========================
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