package org.example.entity;

import jakarta.persistence.*;

/**
 * Join entity between Quote and AddOn
 */
@Entity
@Table(name = "quote_addons")
public class QuoteAddOn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "quote_id")
    private Quote quote;

    @Column(name = "addon_id")
    private Integer addonId;

    // GETTERS & SETTERS

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Quote getQuote() {
        return quote;
    }

    public void setQuote(Quote quote) {
        this.quote = quote;
    }

    public Integer getAddonId() {
        return addonId;
    }

    public void setAddonId(Integer addonId) {
        this.addonId = addonId;
    }
}