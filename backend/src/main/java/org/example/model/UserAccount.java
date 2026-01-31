package org.example.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "useraccounts")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserId")
    private Long userId;

    @Column(name = "CustomerId", nullable = false)
    private Long customerId;

    @Column(name = "EmployeeId")
    private Long employeeId; // null for customer

    @Column(name = "Username", nullable = false)
    private String username;

    @Column(name = "PasswordHash", nullable = false)
    private String passwordHash;

    @Column(name = "Role", nullable = false)
    private String role;

    @Column(name = "IsLocked", nullable = false)
    private Integer isLocked;

    @Column(name = "LastLoginAt")
    private LocalDateTime lastLoginAt;

    @PrePersist
    public void prePersist() {
        if (role == null) role = "Customer";
        if (isLocked == null) isLocked = 0;
    }

    public Long getUserId() { return userId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Integer getIsLocked() { return isLocked; }
    public void setIsLocked(Integer isLocked) { this.isLocked = isLocked; }

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}
