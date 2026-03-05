//package org.example.dto;
//
//import java.time.LocalDate;
//
//public class PaymentUpdateDTO {
//
//    private String method;
//    private String cardNumber;
//    private String holderName;
//    private String cvv;
//    private LocalDate expiredDate;
//
//    public String getMethod() {
//        return method;
//    }
//
//    public void setMethod(String method) {
//        this.method = method;
//    }
//
//    public String getCardNumber() {
//        return cardNumber;
//    }
//
//    public void setCardNumber(String cardNumber) {
//        this.cardNumber = cardNumber;
//    }
//
//    public String getHolderName() {
//        return holderName;
//    }
//
//    public void setHolderName(String holderName) {
//        this.holderName = holderName;
//    }
//
//    public String getCvv() {
//        return cvv;
//    }
//
//    public void setCvv(String cvv) {
//        this.cvv = cvv;
//    }
//
//    public LocalDate getExpiredDate() {
//        return expiredDate;
//    }
//
//    public void setExpiredDate(LocalDate expiredDate) {
//        this.expiredDate = expiredDate;
//    }
//}


package org.example.dto;

import java.time.LocalDate;

public class PaymentUpdateDTO {
    private String method;
    private String holderName;

    // --- NEW FIELDS ---
    private String last4;
    private Integer expiryMonth;
    private Integer expiryYear;
    private String stripePaymentMethodId;

    // Optional: you can still keep full cardNumber & cvv for one-time use but not stored
    private String cardNumber;
    private String cvv;
    private LocalDate expiredDate;

    // --- getters & setters ---

    public String getLast4() { return last4; }
    public void setLast4(String last4) { this.last4 = last4; }

    public Integer getExpiryMonth() { return expiryMonth; }
    public void setExpiryMonth(Integer expiryMonth) { this.expiryMonth = expiryMonth; }

    public Integer getExpiryYear() { return expiryYear; }
    public void setExpiryYear(Integer expiryYear) { this.expiryYear = expiryYear; }

    public String getStripePaymentMethodId() { return stripePaymentMethodId; }
    public void setStripePaymentMethodId(String stripePaymentMethodId) { this.stripePaymentMethodId = stripePaymentMethodId; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getHolderName() { return holderName; }
    public void setHolderName(String holderName) { this.holderName = holderName; }

    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

    public String getCvv() { return cvv; }
    public void setCvv(String cvv) { this.cvv = cvv; }

    public LocalDate getExpiredDate() { return expiredDate; }
    public void setExpiredDate(LocalDate expiredDate) { this.expiredDate = expiredDate; }
}