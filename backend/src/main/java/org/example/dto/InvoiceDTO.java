package org.example.dto;

import java.math.BigDecimal;
import java.util.List;

public class InvoiceDTO {
    public String invoiceNumber;
    public String status;
    public String issueDate;
    public String dueDate;
    public BigDecimal subtotal;
    public BigDecimal taxTotal;
    public BigDecimal total;
    public PaidAccountDTO paidByAccount;
    public List<InvoiceItemDTO> items;
    private String customerName;

    public static class PaidAccountDTO {
        public String method;
        public String last4;
    }

    public static class InvoiceItemDTO {
        public String description;
        public Integer quantity;
        public BigDecimal unitPrice;
        public BigDecimal discountAmount;
        public BigDecimal lineTotal;
    }
}