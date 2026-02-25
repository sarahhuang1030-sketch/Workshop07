//package org.example.entity;
//
//import jakarta.persistence.*;
//import java.time.LocalDate;
//
//@Entity
//public class Invoice {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Integer invoiceId;
//
//    private Integer customerId;
//
//    @Column(length = 50)
//    private String invoiceNumber;
//
//    private LocalDate issueDate;
//
//    private LocalDate dueDate;
//
//    private Double subtotal;
//
//    private Double taxTotal;
//
//    private Double total;
//
//    @Column(length = 50)
//    private String promoCode;
//
//    @Column(length = 30)
//    private String status;
//
//    @ManyToOne
//    @JoinColumn(name = "PaidByAccountId", referencedColumnName = "AccountId")
//    private PaymentAccounts paidByAccount;
//
//    // ===== getters & setters =====
//    public Integer getInvoiceId() { return invoiceId; }
//    public void setInvoiceId(Integer invoiceId) { this.invoiceId = invoiceId; }
//
//    public Integer getCustomerId() { return customerId; }
//    public void setCustomerId(Integer customerId) { this.customerId = customerId; }
//
//    public String getInvoiceNumber() { return invoiceNumber; }
//    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
//
//    public LocalDate getIssueDate() { return issueDate; }
//    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
//
//    public LocalDate getDueDate() { return dueDate; }
//    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
//
//    public Double getSubtotal() { return subtotal; }
//    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
//
//    public Double getTaxTotal() { return taxTotal; }
//    public void setTaxTotal(Double taxTotal) { this.taxTotal = taxTotal; }
//
//    public Double getTotal() { return total; }
//    public void setTotal(Double total) { this.total = total; }
//
//    public String getPromoCode() { return promoCode; }
//    public void setPromoCode(String promoCode) { this.promoCode = promoCode; }
//
//    public String getStatus() { return status; }
//    public void setStatus(String status) { this.status = status; }
//
//    public PaymentAccounts getPaidByAccount() { return paidByAccount; }
//    public void setPaidByAccount(PaymentAccounts paidByAccount) { this.paidByAccount = paidByAccount; }
//}
package org.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
public class Invoice {

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

    @ManyToOne
    @JoinColumn(name = "PaidByAccountId", referencedColumnName = "accountId")
    private PaymentAccounts paidByAccount;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    private List<InvoiceItem> items;

    // ===== getters & setters =====
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

    public List<InvoiceItem> getItems() { return items; }
    public void setItems(List<InvoiceItem> items) { this.items = items; }
}