package org.example.repository;

import org.example.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository for Quote entity
 */
public interface QuoteRepository extends JpaRepository<Quote, Integer> {
    List<Quote> findAllByCustomerId(Integer customerId);
}