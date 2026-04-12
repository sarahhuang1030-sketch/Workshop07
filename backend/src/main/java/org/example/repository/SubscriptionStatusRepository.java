package org.example.repository;

import org.example.model.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionStatusRepository extends JpaRepository<SubscriptionStatus, Integer> {

    List<SubscriptionStatus> findAllByOrderBySortOrderAsc();

    Optional<SubscriptionStatus> findByStatusCodeIgnoreCase(String statusCode);
}