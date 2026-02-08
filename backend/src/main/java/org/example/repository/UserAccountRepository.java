package org.example.repository;

import org.example.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Integer> {
    boolean existsByUsername(String username);
    Optional<UserAccount> findByUsernameIgnoreCase(String username);
    Optional<UserAccount> findByCustomerId(Integer customerId);
    Optional<UserAccount> findByEmployeeId(Integer employeeId);



}

