package org.example.dto;

import java.util.List;

public class CheckoutItemDTO {

    private String description;
    private Integer quantity;
    private Double unitPrice;
    private Double lineTotal;
    private Double discountAmount;
    private List<String> subscribers;

    // NEW FIELDS
    private String itemType;   // "plan", "addon", "device"
    private Integer phoneId;
    private String pricingType;

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public Double getLineTotal() { return lineTotal; }
    public void setLineTotal(Double lineTotal) { this.lineTotal = lineTotal; }

    public Double getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(Double discountAmount) { this.discountAmount = discountAmount; }

    public List<String> getSubscribers() { return subscribers; }
    public void setSubscribers(List<String> subscribers) { this.subscribers = subscribers; }

    // NEW GETTERS/SETTERS
    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }

    public Integer getPhoneId() { return phoneId; }
    public void setPhoneId(Integer phoneId) { this.phoneId = phoneId; }

    public String getPricingType() { return pricingType; }
    public void setPricingType(String pricingType) { this.pricingType = pricingType; }
}