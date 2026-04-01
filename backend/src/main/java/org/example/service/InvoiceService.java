package org.example.service;

import org.example.dto.InvoiceDTO;
import org.example.dto.InvoiceRequestDTO;
import org.example.entity.Invoices;
import org.example.model.Customer;
import org.example.repository.InvoiceRepository;
import org.example.repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          CustomerRepository customerRepository) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
    }

    public Invoices findByInvoiceNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }

    public List<Invoices> findAllInvoices() {
        return invoiceRepository.findAllByOrderByIssueDateDesc();
    }

    public Invoices findLatestByCustomerId(Integer customerId) {
        return invoiceRepository.findTopByCustomerIdOrderByIssueDateDesc(customerId);
    }

    public List<Invoices> findAllByCustomerId(Integer customerId) {
        return invoiceRepository.findByCustomerIdOrderByIssueDateDesc(customerId);
    }

//    added for workshop06 for doing CRUD on invoices
public Invoices createInvoice(InvoiceRequestDTO body) {
    Invoices invoice = new Invoices();
    applyRequest(invoice, body);
    return invoiceRepository.save(invoice);
}

    public Invoices updateInvoice(String invoiceNumber, InvoiceRequestDTO body) {
        Invoices invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (invoice == null) {
            return null;
        }
        applyRequest(invoice, body);
        return invoiceRepository.save(invoice);
    }

    public boolean deleteInvoice(String invoiceNumber) {
        Invoices invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (invoice == null) {
            return false;
        }
        invoiceRepository.delete(invoice);
        return true;
    }

    private void applyRequest(Invoices invoice, InvoiceRequestDTO body) {
        invoice.setCustomerId(body.customerId);
        invoice.setInvoiceNumber(body.invoiceNumber);
        invoice.setStatus(body.status);

        invoice.setIssueDate(body.issueDate != null && !body.issueDate.isBlank()
                ? LocalDate.parse(body.issueDate)
                : null);

        if (body.dueDate != null && !body.dueDate.isBlank()) invoice.setDueDate(LocalDate.parse(body.dueDate));
        else invoice.setDueDate(null);

        invoice.setSubtotal(body.subtotal != null ? body.subtotal : 0.0);
        invoice.setTaxTotal(body.taxTotal != null ? body.taxTotal : 0.0);
        invoice.setTotal(body.total != null ? body.total : 0.0);
    }

    // =====================================================
    // FIX: Convert Invoice Entity -> DTO
    // using customerId lookup (NO entity relation needed)
    // =====================================================
    public InvoiceDTO convertToDTO(Invoices invoice) {

        InvoiceDTO dto = new InvoiceDTO();

        dto.invoiceNumber = invoice.getInvoiceNumber();
        dto.status = invoice.getStatus();
        dto.issueDate = invoice.getIssueDate() != null ? invoice.getIssueDate().toString() : null;
        dto.dueDate = invoice.getDueDate() != null ? invoice.getDueDate().toString() : null;

        dto.subtotal = BigDecimal.valueOf(invoice.getSubtotal());
        dto.taxTotal = BigDecimal.valueOf(invoice.getTaxTotal());
        dto.total = BigDecimal.valueOf(invoice.getTotal());

        // =====================================================
        // CUSTOMER LOOKUP (FIX FOR YOUR SCHEMA)
        // =====================================================
        Customer customer = null;

        if (invoice.getCustomerId() != null) {
            customer = customerRepository.findById(invoice.getCustomerId())
                    .orElse(null);
        }

        // =====================================================
        // BUILD CUSTOMER NAME SAFELY
        // =====================================================
        if (customer != null) {

            String customerName;

            if ("Business".equalsIgnoreCase(customer.getCustomerType())) {
                customerName = customer.getBusinessName();
            } else {
                customerName =
                        (customer.getFirstName() == null ? "" : customer.getFirstName()) +
                                " " +
                                (customer.getLastName() == null ? "" : customer.getLastName());
            }

            dto.setCustomerName(customerName.trim());

        } else {
            dto.setCustomerName("—");
        }

        // =====================================================
        // PAYMENT INFO
        // =====================================================
        if (invoice.getPaidByAccount() != null) {
            InvoiceDTO.PaidAccountDTO paid = new InvoiceDTO.PaidAccountDTO();
            paid.method = invoice.getPaidByAccount().getMethod();
            paid.last4 = invoice.getPaidByAccount().getLast4();
            dto.paidByAccount = paid;
        }

        // =====================================================
        // ITEMS
        // =====================================================
        dto.items = invoice.getItems() == null ? List.of() :
                invoice.getItems().stream().map(item -> {
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