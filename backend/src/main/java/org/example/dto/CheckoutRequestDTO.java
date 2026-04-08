package org.example.dto;

import java.util.List;

public class CheckoutRequestDTO {

    private Integer paymentAccountId;
    private Double subtotal;
    private Double tax;
    private Double total;
    private String promoCode;
    private String billingCycle;
    private String paymentIntentId;
    private String invoiceNumber; // For paying existing invoices
    private List<CheckoutItemDTO> items;  // List of item DTOs

    // Getters & Setters
    public Integer getPaymentAccountId() { return paymentAccountId; }
    public void setPaymentAccountId(Integer paymentAccountId) { this.paymentAccountId = paymentAccountId; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getTax() { return tax; }
    public void setTax(Double tax) { this.tax = tax; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public String getPromoCode() { return promoCode; }
    public void setPromoCode(String promoCode) { this.promoCode = promoCode; }

    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }

    public String getPaymentIntentId() { return paymentIntentId; }
    public void setPaymentIntentId(String paymentIntentId) { this.paymentIntentId = paymentIntentId; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public List<CheckoutItemDTO> getItems() { return items; }
    public void setItems(List<CheckoutItemDTO> items) { this.items = items; }
}