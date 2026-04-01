package org.example.repository;

import org.example.model.SubscriptionAddOn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubscriptionAddOnRepository extends JpaRepository<SubscriptionAddOn, Integer> {
    List<SubscriptionAddOn> findBySubscriptionId(Integer subscriptionId);

    @Query(value = """
    SELECT
        sa.SubscriptionAddOnId,
        sa.SubscriptionId,
        a.AddOnId,
        a.Name AS addOnName,
        a.Description,
        a.MonthlyPrice,
        sa.Status,
        sa.StartDate,
        sa.EndDate
    FROM subscriptionaddons sa
    JOIN subscriptions s
        ON sa.SubscriptionId = s.SubscriptionId
    JOIN addons a
        ON sa.AddOnId = a.AddOnId
    WHERE s.CustomerId = :customerId
      AND s.Status = 'Active'
      AND sa.Status = 'Active'
    ORDER BY sa.StartDate DESC, sa.SubscriptionAddOnId DESC
    """, nativeQuery = true)
    List<Object[]> findActiveAddOnsByCustomerId(@Param("customerId") Integer customerId);
}
