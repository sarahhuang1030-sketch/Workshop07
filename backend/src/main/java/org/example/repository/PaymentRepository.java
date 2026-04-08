package org.example.repository;

import org.example.entity.Payments;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for Payments entity
 */
public interface PaymentRepository extends JpaRepository<Payments, Integer> {
}
