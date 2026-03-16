//for manager dashboard

package org.example.repository;

import org.example.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface ManagerRepository extends JpaRepository<Subscription, Integer> {

    @Query(value = "SELECT COUNT(*) FROM customers", nativeQuery = true)
    long countCustomers();

    @Query(value = "SELECT COUNT(*) FROM subscriptions WHERE Status = 'Active'", nativeQuery = true)
    long countActiveSubscriptions();

    @Query(value = "SELECT COUNT(*) FROM invoices WHERE Status = 'Open'", nativeQuery = true)
    long countPastDueInvoices();

    @Query(value = "SELECT COUNT(*) FROM subscriptions WHERE Status = 'Suspended'", nativeQuery = true)
    long countSuspendedSubscriptions();

    @Query(value = """
        SELECT COALESCE(SUM(plan_total + addon_total), 0)
        FROM (
            SELECT
                s.SubscriptionId,
                COALESCE(MAX(p.MonthlyPrice), 0) AS plan_total,
                COALESCE(SUM(
                    CASE
                        WHEN sa.Status = 'Active' THEN a.MonthlyPrice
                        ELSE 0
                    END
                ), 0) AS addon_total
            FROM subscriptions s
            LEFT JOIN plans p
                ON s.PlanId = p.PlanId
            LEFT JOIN subscriptionaddons sa
                ON s.SubscriptionId = sa.SubscriptionId
            LEFT JOIN addons a
                ON sa.AddOnId = a.AddOnId
            WHERE s.Status = 'Active'
            GROUP BY s.SubscriptionId
        ) AS revenue_by_subscription
        """, nativeQuery = true)
    BigDecimal calculateMonthlyRevenue();


@Query(value = "SELECT COUNT(*) FROM addons", nativeQuery = true)
long countAddOns();

@Query(value = "SELECT COUNT(*) FROM planfeatures", nativeQuery = true)
long countPlanFeatures();

}