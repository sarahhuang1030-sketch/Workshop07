package org.example.service;

import org.example.dto.InvoiceDTO;
import org.example.dto.InvoiceRequestDTO;
import org.example.entity.Invoices;
import org.example.entity.PaymentAccounts;
import org.example.model.Customer;
import org.example.repository.InvoiceRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.PaymentAccountRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Invoice Service
 * FIXED: All read operations use FETCH JOIN queries to avoid lazy loading issues
 */
@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final PaymentAccountRepository paymentAccountRepository;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            CustomerRepository customerRepository,
            PaymentAccountRepository paymentAccountRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
        this.paymentAccountRepository = paymentAccountRepository;
    }

    // ======================================================
    // QUERY (FIXED)
    // ======================================================

    /**
     * FIX: use fetch join version to ensure payment is loaded
     */
    public Invoices findByInvoiceNumber(String invoiceNumber) {
        return invoiceRepository.findFullByInvoiceNumber(invoiceNumber);
    }

    public List<Invoices> findAllInvoices() {
        return invoiceRepository.findAllWithPayment();
    }

    public Invoices findLatestByCustomerId(Integer customerId) {
        return invoiceRepository.findTopByCustomerIdOrderByIssueDateDesc(customerId);
    }

    public List<Invoices> findAllByCustomerId(Integer customerId) {
        return invoiceRepository.findByCustomerIdWithPayment(customerId);
    }

    // ======================================================
    // CREATE INVOICE
    // ======================================================

    public Invoices createInvoice(InvoiceRequestDTO body) {

        Invoices invoice = new Invoices();
        applyRequest(invoice, body);

        PaymentAccounts account = null;

        if (body.paymentAccountId != null) {
            account = paymentAccountRepository.findById(body.paymentAccountId).orElse(null);
        } else if (body.customerId != null) {
            account = paymentAccountRepository
                    .findFirstByCustomerIdOrderByCreatedAtDesc(body.customerId)
                    .orElse(null);
        }

        if (account != null) {
            invoice.setPaidByAccount(account);
        }

        // SAVE
        Invoices saved = invoiceRepository.save(invoice);

        // IMPORTANT FIX:
        // re-fetch using FETCH JOIN (not findById!)
        return invoiceRepository.findFullByInvoiceNumber(saved.getInvoiceNumber());
    }

    // ======================================================
    // UPDATE
    // ======================================================

    public Invoices updateInvoice(String invoiceNumber, InvoiceRequestDTO body) {

        Invoices invoice =
                invoiceRepository.findFullByInvoiceNumber(invoiceNumber);

        if (invoice == null) return null;

        applyRequest(invoice, body);

        invoiceRepository.save(invoice);

        // re-fetch safe version
        return invoiceRepository.findFullByInvoiceNumber(invoiceNumber);
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
    // APPLY REQUEST
    // ======================================================

    private void applyRequest(Invoices invoice, InvoiceRequestDTO body) {

        invoice.setCustomerId(body.customerId);
        invoice.setInvoiceNumber(body.invoiceNumber);
        invoice.setStatus(body.status);

        invoice.setIssueDate(
                body.issueDate != null && !body.issueDate.isBlank()
                        ? LocalDate.parse(body.issueDate)
                        : null
        );

        invoice.setDueDate(
                body.dueDate != null && !body.dueDate.isBlank()
                        ? LocalDate.parse(body.dueDate)
                        : null
        );

        invoice.setSubtotal(body.subtotal != null ? body.subtotal : 0.0);
        invoice.setTaxTotal(body.taxTotal != null ? body.taxTotal : 0.0);
        invoice.setTotal(body.total != null ? body.total : 0.0);
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

        // ======================================================
        // CUSTOMER (unchanged)
        // ======================================================
        Customer customer = null;

        if (invoice.getCustomerId() != null) {
            customer = customerRepository.findById(invoice.getCustomerId()).orElse(null);
        }

        if (customer != null) {
            if ("Business".equalsIgnoreCase(customer.getCustomerType())) {
                dto.setCustomerName(customer.getBusinessName());
            } else {
                dto.setCustomerName(
                        (customer.getFirstName() == null ? "" : customer.getFirstName()) + " " +
                                (customer.getLastName() == null ? "" : customer.getLastName())
                );
            }
        } else {
            dto.setCustomerName("—");
        }


        PaymentAccounts account = invoice.getPaidByAccount();

        InvoiceDTO.PaymentAccountDTO paid = new InvoiceDTO.PaymentAccountDTO();

        if (account != null) {

            paid.setMethod(account.getMethod());   // Visa / MasterCard
            paid.setLast4(account.getLast4());
            paid.setAccountId(account.getAccountId());

        } else {

            // fallback ONLY (never show Stripe as payment method)
            paid.setMethod("Online Payment");
            paid.setLast4(null);
            paid.setAccountId(null);
        }

        dto.paidByAccount = paid;

        // ======================================================
        // ITEMS
        // ======================================================
        dto.items = invoice.getItems() == null ? List.of()
                : invoice.getItems().stream().map(item -> {

            InvoiceDTO.InvoiceItemDTO i = new InvoiceDTO.InvoiceItemDTO();
            i.description = item.getDescription();
            i.quantity = item.getQuantity();
            i.unitPrice = item.getUnitPrice();
            i.discountAmount = item.getDiscountAmount();
            i.lineTotal = item.getLineTotal();
            return i;

        }).toList();

        return dto;
    }
}