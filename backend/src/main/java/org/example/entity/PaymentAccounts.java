package org.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "paymentaccounts")
public class PaymentAccounts {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AccountId")
    private Integer accountId;

    @Column(name = "CustomerId", nullable = false)
    private Integer customerId;

    @Column(name = "balance")
    private Double balance;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt;

    @Column(name = "cardNumber")
    private String cardNumber; // plaintext

    @Column(name = "cvv")
    private String cvv;        // plaintext

    @Column(name = "expiredDate")
    private LocalDate expiredDate;

    @Column(name = "method")
    private String method;

    @Column(name = "holderName")
    private String holderName;

    @Column(name = "expiryMonth")
    private Integer expiryMonth;

    @Column(name = "expiryYear")
    private Integer expiryYear;

    @Column(name = "last4")
    private String last4;

    @Column(name = "stripePaymentMethodId")
    private String stripePaymentMethodId;

    // --- getters & setters ---
    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

    public String getCvv() { return cvv; }
    public void setCvv(String cvv) { this.cvv = cvv; }

    public LocalDate getExpiredDate() { return expiredDate; }
    public void setExpiredDate(LocalDate expiredDate) { this.expiredDate = expiredDate; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getHolderName() { return holderName; }
    public void setHolderName(String holderName) { this.holderName = holderName; }

    public Integer getExpiryMonth() { return expiryMonth; }
    public void setExpiryMonth(Integer expiryMonth) { this.expiryMonth = expiryMonth; }

    public Integer getExpiryYear() { return expiryYear; }
    public void setExpiryYear(Integer expiryYear) { this.expiryYear = expiryYear; }

    public String getLast4() { return last4; }
    public void setLast4(String last4) { this.last4 = last4; }

    public String getStripePaymentMethodId() { return stripePaymentMethodId; }
    public void setStripePaymentMethodId(String stripePaymentMethodId) { this.stripePaymentMethodId = stripePaymentMethodId; }
}