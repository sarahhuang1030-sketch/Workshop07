package org.example.repository;

import org.example.model.SubscriptionAddOn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubscriptionAddOnRepository extends JpaRepository<SubscriptionAddOn, Integer> {
    List<SubscriptionAddOn> findBySubscriptionId(Integer subscriptionId);
}
