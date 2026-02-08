package org.example.repository;

import org.example.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    void deleteByExpiresAtBefore(LocalDateTime cutoff);

    void deleteByUserId(Integer userId);
}
