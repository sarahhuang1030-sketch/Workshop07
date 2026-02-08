package org.example.repository;

import org.example.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    @Query("""
        SELECT t FROM PasswordResetToken t
        WHERE t.token = :token
          AND t.used = false
          AND t.expiresAt > :now
    """)
    Optional<PasswordResetToken> findValid(@Param("token") String token,
                                           @Param("now") LocalDateTime now);

    // convenience wrapper (optional)
    default Optional<PasswordResetToken> findValid(String token) {
        return findValid(token, LocalDateTime.now());
    }

    //Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);
}
