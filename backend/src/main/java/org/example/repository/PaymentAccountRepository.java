package org.example.repository;

import org.example.entity.PaymentAccounts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentAccountRepository extends JpaRepository<PaymentAccounts, Integer> {

    Optional<PaymentAccounts> findByAccountIdAndCustomerId(Integer accountId, Integer customerId);
    Optional<PaymentAccounts> findFirstByCustomerIdOrderByCreatedAtDesc(Integer customerId);

}