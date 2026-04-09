package org.example.repository;

import org.example.entity.Payments;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for Payments entity
 */
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payments, Integer> {
    List<Payments> findByInvoiceId(Integer invoiceId);
}
