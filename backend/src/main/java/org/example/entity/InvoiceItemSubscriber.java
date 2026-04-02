package org.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "invoice_item_subscribers")
public class InvoiceItemSubscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subscriber_id")
    private Integer subscriberId;

    @ManyToOne
    @JoinColumn(name = "invoice_item_id", nullable = false)
    private InvoiceItems invoiceItem;

    @Column(name = "line_number")
    private Integer lineNumber;

    @Column(name = "full_name")
    private String fullName;

    // Getters & setters
    public Integer getSubscriberId() {
        return subscriberId;
    }

    public InvoiceItems getInvoiceItem() {
        return invoiceItem;
    }

    public void setInvoiceItem(InvoiceItems invoiceItem) {
        this.invoiceItem = invoiceItem;
    }

    public Integer getLineNumber() {
        return lineNumber;
    }

    public void setLineNumber(Integer lineNumber) {
        this.lineNumber = lineNumber;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}