package org.example.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "useraccounts")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserId")
    private Integer userId;

    @Column(name = "CustomerId")
    private Integer customerId;

    @Column(name = "EmployeeId")
    private Integer employeeId;

    @Column(name = "Username", nullable = false)
    private String username;

    @Column(name = "PasswordHash")
    private String passwordHash;

    @ManyToOne
    @JoinColumn(name = "RoleId")
    private Role role;

    @Column(name = "IsLocked", nullable = false)
    private Integer isLocked;

    @Column(name = "LastLoginAt")
    private LocalDateTime lastLoginAt;

    @Column(name = "AvatarUrl")
    private String avatarUrl;

    @Column(name = "stripe_customer_id")
    private String stripeCustomerId;

    @Column(name = "MustChangePassword", nullable = false)
    private Boolean mustChangePassword = false;

    @Column(name = "TempPasswordExpiresAt")
    private LocalDateTime tempPasswordExpiresAt;

    @Column(name = "PasswordChangedAt")
    private LocalDateTime passwordChangedAt;

    @Column(name = "IsActive", nullable = false)
    private Boolean isActive = true;

    @Column(name = "points", nullable = false)
    private Integer points = 0;

    // ===================== JPA LIFECYCLE =====================
    @PrePersist
    public void prePersist() {
        if (isLocked == null) isLocked = 0;
        if (points == null) points = 0;
        if (isActive == null) isActive = true;
        if (mustChangePassword == null) mustChangePassword = false;
    }

    // ===================== BASIC GETTERS / SETTERS =====================

    public Integer getUserId() {
        return userId;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Integer getIsLocked() {
        return isLocked;
    }

    public void setIsLocked(Integer isLocked) {
        this.isLocked = isLocked;
    }

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getStripeCustomerId() {
        return stripeCustomerId;
    }

    public void setStripeCustomerId(String stripeCustomerId) {
        this.stripeCustomerId = stripeCustomerId;
    }

    public Boolean getMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(Boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

    public LocalDateTime getTempPasswordExpiresAt() {
        return tempPasswordExpiresAt;
    }

    public void setTempPasswordExpiresAt(LocalDateTime tempPasswordExpiresAt) {
        this.tempPasswordExpiresAt = tempPasswordExpiresAt;
    }

    public LocalDateTime getPasswordChangedAt() {
        return passwordChangedAt;
    }

    public void setPasswordChangedAt(LocalDateTime passwordChangedAt) {
        this.passwordChangedAt = passwordChangedAt;
    }

    public Boolean getIsActive() {
        return isActive != null ? isActive : true;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    // ===================== POINTS =====================

    public Integer getPoints() {
        return points != null ? points : 0;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public void addPoints(Integer add) {
        if (add == null) return;
        if (this.points == null) this.points = 0;
        this.points += add;
    }
}