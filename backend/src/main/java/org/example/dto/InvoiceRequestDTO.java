package org.example.dto;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class InvoiceRequestDTO {
    public Integer customerId;
    public String invoiceNumber;
    public String status;
    public String issueDate;
    public String dueDate;
    public Double subtotal;
    public Double taxTotal;
    public Double total;
    public Integer paymentAccountId;

    /**
     * Billing cycle sent from the frontend checkout.
     * Expected values: "monthly" | "yearly" | "annual" | "one-time"
     * Used by InvoiceService.createInvoice() to decide whether
     * to apply the 10% annual discount to each recurring line item.
     */
    private String billingCycle;

    @JsonProperty("items")
    private List<ItemDTO> items;

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getIssueDate() { return issueDate; }
    public void setIssueDate(String issueDate) { this.issueDate = issueDate; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getTaxTotal() { return taxTotal; }
    public void setTaxTotal(Double taxTotal) { this.taxTotal = taxTotal; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public Integer getPaymentAccountId() { return paymentAccountId; }
    public void setPaymentAccountId(Integer paymentAccountId) { this.paymentAccountId = paymentAccountId; }

    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }

    public List<ItemDTO> getItems() { return items; }
    public void setItems(List<ItemDTO> items) { this.items = items; }
}