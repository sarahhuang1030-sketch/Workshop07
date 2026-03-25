package org.example.repository;

import org.example.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for Quote entity
 */
public interface QuoteRepository extends JpaRepository<Quote, Integer> {
}