package org.example.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // matches user_id INT NOT NULL
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    // matches token_hash VARCHAR(64) NOT NULL
    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    // used TINYINT(1) NOT NULL DEFAULT 0
    @Column(nullable = false)
    private boolean used = false;

    // created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    @CreationTimestamp
    @Column(name = "created_at", updatable = false, insertable = false)
    private LocalDateTime createdAt;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    // getters/setters
    public Long getId() { return id; }

    public UserAccount getUser() { return user; }
    public void setUser(UserAccount user) { this.user = user; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
