package org.example.dto;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonAlias;

public class CheckoutItemDTO {

    private String description;
    private Integer quantity;
    private Double unitPrice;
    private Double lineTotal;
    private Double discountAmount;
    private List<String> subscribers;

    // NEW FIELDS
    @JsonAlias({"type", "itemType"})
    private String itemType;

    @JsonAlias({"planId", "addonId", "id"})
    private Integer id;

    private String serviceType;
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
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }

    public Integer getPhoneId() { return phoneId; }
    public void setPhoneId(Integer phoneId) { this.phoneId = phoneId; }

    public String getPricingType() { return pricingType; }
    public void setPricingType(String pricingType) { this.pricingType = pricingType; }

    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
}