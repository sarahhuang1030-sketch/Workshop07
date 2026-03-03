package org.example.dto;

import java.time.LocalDate;

public class BillingPaymentDTO {

    private String method;
    private LocalDate expiredDate;
    private Double balance;
    private String last4;
    private String holderName;
    private String displayCard;

    // getters and setters
    public String getHolderName() { return holderName; }
    public void setHolderName(String holderName) { this.holderName = holderName; }

    public String getDisplayCard() { return displayCard; }
    public void setDisplayCard(String displayCard) { this.displayCard = displayCard; }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public LocalDate getExpiredDate() {
        return expiredDate;
    }

    public void setExpiredDate(LocalDate expiredDate) {
        this.expiredDate = expiredDate;
    }

    public Double getBalance() {
        return balance;
    }

    public void setBalance(Double balance) {
        this.balance = balance;
    }

    public String getLast4() {
        return last4;
    }

    public void setLast4(String last4) {
        this.last4 = last4;
    }
}