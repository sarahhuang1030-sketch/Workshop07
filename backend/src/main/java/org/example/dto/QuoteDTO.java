package org.example.dto;

import java.util.List;

/**
 * Quote DTO (for frontend display)
 */
/**
 * Quote DTO (for frontend display)
 */
public class QuoteDTO {

    private Integer id;
    private Integer customerId;
    private String customerName;
    private Double amount;
    private String status;
    private Integer planId;
    private List<Integer> addonIds;

    private List<QuoteItemDTO> items;

    public QuoteDTO() {}

    // getters & setters

    public Integer getPlanId() {
        return planId;
    }

    public void setPlanId(Integer planId) {
        this.planId = planId;
    }

    public List<Integer> getAddonIds() {
        return addonIds;
    }

    public void setAddonIds(List<Integer> addonIds) {
        this.addonIds = addonIds;
    }

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