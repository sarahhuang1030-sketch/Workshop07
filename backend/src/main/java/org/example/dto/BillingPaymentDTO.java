//package org.example.dto;
//
//import java.time.LocalDate;
//
//public class BillingPaymentDTO {
//
//    private String method;
//    private LocalDate expiredDate;
//    private Double balance;
//    private String last4;
//    private String holderName;
//    private String displayCard;
//
//    // getters and setters
//    public String getHolderName() { return holderName; }
//    public void setHolderName(String holderName) { this.holderName = holderName; }
//
//    public String getDisplayCard() { return displayCard; }
//    public void setDisplayCard(String displayCard) { this.displayCard = displayCard; }
//
//    public String getMethod() {
//        return method;
//    }
//
//    public void setMethod(String method) {
//        this.method = method;
//    }
//
//    public LocalDate getExpiredDate() {
//        return expiredDate;
//    }
//
//    public void setExpiredDate(LocalDate expiredDate) {
//        this.expiredDate = expiredDate;
//    }
//
//    public Double getBalance() {
//        return balance;
//    }
//
//    public void setBalance(Double balance) {
//        this.balance = balance;
//    }
//
//    public String getLast4() {
//        return last4;
//    }
//
//    public void setLast4(String last4) {
//        this.last4 = last4;
//    }
//}

package org.example.dto;

import java.time.LocalDate;

public class BillingPaymentDTO {

    private String method;
    private String holderName;
    private String last4;
    private Integer expiryMonth;
    private Integer expiryYear;
    private String stripePaymentMethodId;
    private String displayCard;
    private Double balance;
    private LocalDate expiredDate;
    private String cardNumber;
    private String cvv;

    private boolean isDefault;

    // --- getters & setters ---
    public boolean getIsDefault() { return isDefault; }
    public void setIsDefault(boolean isDefault) { this.isDefault = isDefault; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getHolderName() { return holderName; }
    public void setHolderName(String holderName) { this.holderName = holderName; }

    public String getLast4() { return last4; }
    public void setLast4(String last4) { this.last4 = last4; }

    public Integer getExpiryMonth() { return expiryMonth; }
    public void setExpiryMonth(Integer expiryMonth) { this.expiryMonth = expiryMonth; }

    public Integer getExpiryYear() { return expiryYear; }
    public void setExpiryYear(Integer expiryYear) { this.expiryYear = expiryYear; }

    public String getStripePaymentMethodId() { return stripePaymentMethodId; }
    public void setStripePaymentMethodId(String stripePaymentMethodId) { this.stripePaymentMethodId = stripePaymentMethodId; }

    public String getDisplayCard() { return displayCard; }
    public void setDisplayCard(String displayCard) { this.displayCard = displayCard; }

    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }

    public LocalDate getExpiredDate() { return expiredDate; }
    public void setExpiredDate(LocalDate expiredDate) { this.expiredDate = expiredDate; }

    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

    public String getCvv() { return cvv; }
    public void setCvv(String cvv) { this.cvv = cvv; }
}