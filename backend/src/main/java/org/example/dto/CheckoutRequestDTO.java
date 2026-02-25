package org.example.dto;

import org.example.entity.InvoiceItems;

import java.util.List;

public class CheckoutRequestDTO {

    private Double subtotal;
    private Double tax;
    private Double total;
    private Integer paymentAccountId;
    private String promoCode;
    private String billingCycle;

    // add items
    private List<InvoiceItems> items;

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getTax() { return tax; }
    public void setTax(Double tax) { this.tax = tax; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public Integer getPaymentAccountId() { return paymentAccountId; }
    public void setPaymentAccountId(Integer paymentAccountId) { this.paymentAccountId = paymentAccountId; }

    public String getPromoCode() { return promoCode; }
    public void setPromoCode(String promoCode) { this.promoCode = promoCode; }

    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }

    public List<InvoiceItems> getItems() { return items; }
    public void setItems(List<InvoiceItems> items) { this.items = items; }
}