package org.example.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
//@Table(name = "Invoices")
@Table(name = "invoices")
public class Invoices {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer invoiceId;

    private Integer customerId;

    @Column(length = 50)
    private String invoiceNumber;

    private LocalDate issueDate;

    private LocalDate dueDate;

    private Double subtotal;
    private Double taxTotal;
    private Double total;

    @Column(length = 50)
    private String promoCode;

    @Column(length = 30)
    private String status;

    @Column(length = 255)
    private String stripePaymentIntentId;

    @Column(name = "quote_id")
    private Integer quoteId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "PaidByAccountId")
    private PaymentAccounts paidByAccount;

    @Column(name = "source")
    private String source; // QUOTE / MANUAL / SUBSCRIPTION

    @Column(name = "lifecycle_stage")
    private String lifecycleStage; // PENDING / APPROVED / PAID

    // One invoice can have many invoice items
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<InvoiceItems> items;

    // ===== Getters and Setters =====

    public Integer getInvoiceId() { return invoiceId; }
    public void setInvoiceId(Integer invoiceId) { this.invoiceId = invoiceId; }

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getTaxTotal() { return taxTotal; }
    public void setTaxTotal(Double taxTotal) { this.taxTotal = taxTotal; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public String getPromoCode() { return promoCode; }
    public void setPromoCode(String promoCode) { this.promoCode = promoCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public PaymentAccounts getPaidByAccount() { return paidByAccount; }
    public void setPaidByAccount(PaymentAccounts paidByAccount) { this.paidByAccount = paidByAccount; }

    public List<InvoiceItems> getItems() { return items; }
    public void setItems(List<InvoiceItems> items) { this.items = items; }

    public String getStripePaymentIntentId() {return stripePaymentIntentId; }
    public void setStripePaymentIntentId(String stripePaymentIntentId) { this.stripePaymentIntentId = stripePaymentIntentId; }

    public Integer getQuoteId() {
        return quoteId;
    }

    public void setQuoteId(Integer quoteId) {
        this.quoteId = quoteId;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getLifecycleStage() {
        return lifecycleStage;
    }

    public void setLifecycleStage(String lifecycleStage) {
        this.lifecycleStage = lifecycleStage;
    }
}