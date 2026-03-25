package org.example.service;

import org.example.dto.InvoiceDTO;
import org.example.entity.Invoices;
import org.example.repository.InvoiceRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    public InvoiceService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    public Invoices findByInvoiceNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }

    public Invoices findLatestByCustomerId(Integer customerId) {
        return invoiceRepository.findTopByCustomerIdOrderByIssueDateDesc(customerId);
    }

    public InvoiceDTO convertToDTO(Invoices invoice) {
        InvoiceDTO dto = new InvoiceDTO();
        dto.invoiceNumber = invoice.getInvoiceNumber();
        dto.status = invoice.getStatus();
        dto.issueDate = invoice.getIssueDate().toString();
        dto.dueDate = invoice.getDueDate().toString();
        dto.subtotal = BigDecimal.valueOf(invoice.getSubtotal());
        dto.taxTotal = BigDecimal.valueOf(invoice.getTaxTotal());
        dto.total = BigDecimal.valueOf(invoice.getTotal());

        if (invoice.getPaidByAccount() != null) {
            InvoiceDTO.PaidAccountDTO paid = new InvoiceDTO.PaidAccountDTO();
            paid.method = invoice.getPaidByAccount().getMethod();
            paid.last4 = invoice.getPaidByAccount().getLast4();
            dto.paidByAccount = paid;
        }

        dto.items = invoice.getItems().stream().map(item -> {
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