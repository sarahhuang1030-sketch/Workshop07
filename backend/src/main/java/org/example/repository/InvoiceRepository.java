package org.example.repository;

import org.example.entity.Invoices;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoices, Integer> {}