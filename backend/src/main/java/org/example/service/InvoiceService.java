package org.example.service;

import org.example.dto.InvoiceDTO;
import org.example.entity.Invoices;
import org.example.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.math.BigDecimal;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    public InvoiceService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    // Get invoice by invoice number
    public Invoices findByInvoiceNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }

    // find all invoices**
    public List<Invoices> findAllInvoices() {
        return invoiceRepository.findAllByOrderByIssueDateDesc();
    }

    // Get latest invoice for a customer
    public Invoices findLatestByCustomerId(Integer customerId) {
        return invoiceRepository.findTopByCustomerIdOrderByIssueDateDesc(customerId);
    }

    // Get all invoices for a customer
    public List<Invoices> findAllByCustomerId(Integer customerId) {
        return invoiceRepository.findByCustomerIdOrderByIssueDateDesc(customerId);
    }

    // Convert invoice entity to DTO for frontend
    public InvoiceDTO convertToDTO(Invoices invoice) {
        InvoiceDTO dto = new InvoiceDTO();
        dto.invoiceNumber = invoice.getInvoiceNumber();
        dto.status = invoice.getStatus();
        dto.issueDate = invoice.getIssueDate().toString();
        dto.dueDate = invoice.getDueDate().toString();
        dto.subtotal = BigDecimal.valueOf(invoice.getSubtotal());
        dto.taxTotal = BigDecimal.valueOf(invoice.getTaxTotal());
        dto.total = BigDecimal.valueOf(invoice.getTotal());

        // Map payment info if exists
        if (invoice.getPaidByAccount() != null) {
            InvoiceDTO.PaidAccountDTO paid = new InvoiceDTO.PaidAccountDTO();
            paid.method = invoice.getPaidByAccount().getMethod();
            paid.last4 = invoice.getPaidByAccount().getLast4();
            dto.paidByAccount = paid;
        }

        // Map invoice line items
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