package org.example.repository;

import org.example.entity.InvoiceItems;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItems, Integer> {
    List<InvoiceItems> findByInvoice_InvoiceId(Integer invoiceId);
}