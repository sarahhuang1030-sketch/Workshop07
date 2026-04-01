package org.example.repository;

import org.example.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Integer> {

    // Check if username exists (case-sensitive)
    boolean existsByUsername(String username);

    // Case-insensitive check (USED in username generation)
    boolean existsByUsernameIgnoreCase(String username);

    // Find user by username (case-insensitive login support)
    Optional<UserAccount> findByUsernameIgnoreCase(String username);

    // Find user by username (exact match)
    Optional<UserAccount> findByUsername(String username);

    // Find by customer ID
    Optional<UserAccount> findByCustomerId(Integer customerId);

    // Find by employee ID
    Optional<UserAccount> findByEmployeeId(Integer employeeId);
}