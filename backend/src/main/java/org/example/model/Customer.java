package org.example.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CustomerId")
    private Integer CustomerId;

    @Column(name = "CustomerType", nullable = false)
    private String CustomerType; // "Individual" or "Business"

    @Column(name = "FirstName")
    private String FirstName;

    @Column(name = "LastName")
    private String LastName;

    @Column(name = "BusinessName")
    private String BusinessName;

    @Column(name = "Email", nullable = false)
    private String email;

    @Column(name = "HomePhone", nullable = false)
    private String HomePhone;

    @Column(name = "Status")
    private String Status; // "Active"/"Inactive"

    @Column(name = "CreatedAt")
    private LocalDateTime CreatedAt;

    // exists in your table; can remain null if DB allows
    @Column(name = "PasswordHash")
    private String PasswordHash;

    @PrePersist
    public void prePersist() {
        if (CreatedAt == null) CreatedAt = LocalDateTime.now();
        if (Status == null) Status = "Active";
    }

    // getters/setters
    public Integer getCustomerId() { return CustomerId; }

    public String getCustomerType() { return CustomerType; }
    public void setCustomerType(String customerType) { this.CustomerType = customerType; }


    public String getFirstName() { return FirstName; }
    public void setFirstName(String firstName) { this.FirstName = firstName; }

    public String getLastName() { return LastName; }
    public void setLastName(String lastName) { this.LastName = lastName; }

    public String getBusinessName() { return BusinessName; }
    public void setBusinessName(String businessName) { this.BusinessName = businessName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getHomePhone() { return HomePhone; }
    public void setHomePhone(String homePhone) { this.HomePhone = homePhone; }

    public String getStatus() { return Status; }
    public void setStatus(String status) { this.Status = status; }

    public LocalDateTime getCreatedAt() { return CreatedAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.CreatedAt = createdAt; }

    public String getPasswordHash() { return PasswordHash; }
    public void setPasswordHash(String passwordHash) { this.PasswordHash = passwordHash; }


}
