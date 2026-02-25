package org.example.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
//@Table(name = "InvoiceItems")
public class InvoiceItems {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Integer invoiceItemId;

        // Many invoice items belong to one invoice
        @ManyToOne
        @JoinColumn(name = "InvoiceId") // database column
        private Invoices invoices; // property name used in mappedBy

        @Column(length = 255)
        private String description;

        private Integer quantity;

        private BigDecimal unitPrice;

        private BigDecimal discountAmount;

        private BigDecimal lineTotal;

        // ===== Getters and Setters =====

        public Integer getInvoiceItemId() { return invoiceItemId; }
        public void setInvoiceItemId(Integer invoiceItemId) { this.invoiceItemId = invoiceItemId; }

        public Invoices getInvoice() { return invoices; }
        public void setInvoice(Invoices invoices) { this.invoices = invoices; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

        public BigDecimal getDiscountAmount() { return discountAmount; }
        public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

        public BigDecimal getLineTotal() { return lineTotal; }
        public void setLineTotal(BigDecimal lineTotal) { this.lineTotal = lineTotal; }
}