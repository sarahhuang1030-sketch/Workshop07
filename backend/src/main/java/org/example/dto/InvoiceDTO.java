package org.example.dto;

import java.math.BigDecimal;
import java.util.List;

public class InvoiceDTO {

    // =========================
    // Basic invoice fields
    // =========================
    public String invoiceNumber;
    public String status;
    public String issueDate;
    public String dueDate;
    public String startDate;
    public String endDate;

    public BigDecimal subtotal;
    public BigDecimal taxTotal;
    public BigDecimal total;

    // =========================
    // Payment info (IMPORTANT)
    // =========================
    public PaymentAccountDTO paidByAccount;

    // =========================
    // Invoice items
    // =========================
    public List<InvoiceItemDTO> items;

    private String customerName;

    // =========================
    // Customer name getter/setter
    // =========================
    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    // =========================
    // PaymentAccountDTO
    // =========================
    public static class PaymentAccountDTO {

        private Integer accountId;
        private String method;
        private String last4;
        private String holderName;
        private String expiryMonth;
        private String expiryYear;

        public Integer getAccountId() { return accountId; }
        public void setAccountId(Integer accountId) { this.accountId = accountId; }

        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }

        public String getLast4() { return last4; }
        public void setLast4(String last4) { this.last4 = last4; }

        public String getHolderName() { return holderName; }
        public void setHolderName(String holderName) { this.holderName = holderName; }

        public String getExpiryMonth() { return expiryMonth; }
        public void setExpiryMonth(String expiryMonth) { this.expiryMonth = expiryMonth; }

        public String getExpiryYear() { return expiryYear; }
        public void setExpiryYear(String expiryYear) { this.expiryYear = expiryYear; }
    }

    // =========================
    // Invoice item DTO
    // =========================
    public static class InvoiceItemDTO {
        public String description;
        public Integer quantity;
        public BigDecimal unitPrice;
        public BigDecimal discountAmount;
        public BigDecimal lineTotal;
        public String itemType;
        public String serviceType;
    }
}