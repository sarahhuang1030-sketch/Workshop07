package org.example.repository;

import org.example.entity.Invoices;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// Repository for Invoices entity
public interface InvoiceRepository extends JpaRepository<Invoices, Integer> {

    // Find single invoice by invoice number
    Invoices findByInvoiceNumber(String invoiceNumber);

    // Find latest invoice for a customer
    Invoices findTopByCustomerIdOrderByIssueDateDesc(Integer customerId);

    // Find all invoices for a customer, ordered by issue date descending
    List<Invoices> findByCustomerIdOrderByIssueDateDesc(Integer customerId);

    // Find all invoices ordered by date**
    List<Invoices> findAllByOrderByIssueDateDesc();
}