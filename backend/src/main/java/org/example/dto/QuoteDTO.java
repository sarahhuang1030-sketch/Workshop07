package org.example.dto;

import java.util.List;

/**
 * Quote DTO (for frontend display)
 */
public class QuoteDTO {

    private Integer id;
    private Integer customerId;
    private String customerName;
    private Double amount;
    private String status;
    private List<QuoteItemDTO> items;

    public QuoteDTO() {}

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<QuoteItemDTO> getItems() {
        return items;
    }

    public void setItems(List<QuoteItemDTO> items) {
        this.items = items;
    }
}