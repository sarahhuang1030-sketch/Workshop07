package org.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "customers")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    //Sarah modified for reset password link
    @Column(name = "CustomerId")
    private Integer CustomerId;

    @Column(name = "FirstName") // Added so it maps to the actual column in customers table
    private String name;

    @Column(name = "Email") // Added mapping to real column
    private String email;

    public User() {
    }

    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }

    // Getter & Setter
    //Sarah modified for reset password link
    public Integer getCustomerId() { return CustomerId; }
    public void setCustomerId(Integer id) { this.CustomerId = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

}