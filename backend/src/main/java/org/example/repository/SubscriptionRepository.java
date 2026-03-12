package org.example.repository;


import org.example.model.SubscriptionAddOn;
import org.example.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubscriptionRepository
        extends JpaRepository<Subscription, Integer> {
}



