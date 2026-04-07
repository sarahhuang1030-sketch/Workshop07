package org.example.dto;

/**
 * Quote Item DTO
 * Represents each item inside a quote (plan or addon)
 */
public class QuoteItemDTO {

    private Integer id;        // item id (planId or addOnId)
    private String name;       // plan or addon name
    private Double price;      // price per item
    private String type;       // PLAN / ADDON

    public QuoteItemDTO() {}

    public QuoteItemDTO(Integer id, String name, Double price, String type) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.type = type;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}