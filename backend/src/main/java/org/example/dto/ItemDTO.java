package org.example.dto;

/**
 * ItemDTO
 * Used for invoice items coming from frontend bundle creation.
 * Supports both Plan and AddOn mapping.
 */
public class ItemDTO {

    private Integer id;       // planId / addonId
    private String type;      // "plan" | "addon"

    private String name;      // optional (frontend display)
    private Double price;     // optional

    private Integer quantity;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
