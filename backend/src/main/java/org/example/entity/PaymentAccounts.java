package org.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

//@Entity
//public class PaymentAccounts {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    @Column(name = "AccountId")
//    private Integer accountId;
//
//    @Column(name = "CustomerId")
//    private Integer customerId;
//
//    @Column(name = "HolderName")
//    private String holderName;
//
//    @Column(name = "Method")
//    private String method;
//
//    @Column(name = "Balance")
//    private Double balance;
//
//    @Column(name = "CardNumber")
//    private String cardNumber;
//
//    @Column(name = "Cvv")
//    private String cvv;
//
//    @Column(name = "ExpiredDate")
//    private LocalDate expiredDate;
//
//    @Column(name = "CreatedAt")
//    private LocalDateTime createdAt;
//
//    @PrePersist
//    public void prePersist() {
//        if (createdAt == null) {
//            createdAt = LocalDateTime.now();
//        }
//    }
//
//    // =============================
//    // Getters and Setters
//    // =============================
//
//    public Integer getAccountId() {
//        return accountId;
//    }
//
//    public void setAccountId(Integer accountId) {
//        this.accountId = accountId;
//    }
//
//    public Integer getCustomerId() {
//        return customerId;
//    }
//
//    public void setCustomerId(Integer customerId) {
//        this.customerId = customerId;
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
//    public String getMethod() {
//        return method;
//    }
//
//    public void setMethod(String method) {
//        this.method = method;
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
//    public String getCardNumber() {
//        return cardNumber;
//    }
//
//    public void setCardNumber(String cardNumber) {
//        this.cardNumber = cardNumber;
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
//
//    public LocalDateTime getCreatedAt() {
//        return createdAt;
//    }
//
//    public void setCreatedAt(LocalDateTime createdAt) {
//        this.createdAt = createdAt;
//    }
//}


    @Entity
    public class PaymentAccounts {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Integer accountId;

        private Integer customerId;

        private String holderName;

        // Payment method, e.g., Credit Card, PayPal
        private String method;

        private Double balance;

        // Credit card info (plain text for now)
        private String cardNumber;

        private String cvv;

        private LocalDate expiredDate;

        private LocalDateTime createdAt;

        // Getters and Setters
        public Integer getAccountId() { return accountId; }
        public void setAccountId(Integer accountId) { this.accountId = accountId; }

        public Integer getCustomerId() { return customerId; }
        public void setCustomerId(Integer customerId) { this.customerId = customerId; }

        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }

        public String getHolderName() { return holderName; }
        public void setHolderName(String holderName) {
            this.holderName = holderName;
        }

        public Double getBalance() { return balance; }
        public void setBalance(Double balance) { this.balance = balance; }

        public String getCardNumber() { return cardNumber; }
        public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

        public String getCvv() { return cvv; }
        public void setCvv(String cvv) { this.cvv = cvv; }

        public LocalDate getExpiredDate() { return expiredDate; }
        public void setExpiredDate(LocalDate expiredDate) { this.expiredDate = expiredDate; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
