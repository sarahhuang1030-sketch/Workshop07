package org.example.repository;

import org.example.entity.InvoiceItemSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvoiceItemSubscriberRepository extends JpaRepository<InvoiceItemSubscriber, Integer> {
}