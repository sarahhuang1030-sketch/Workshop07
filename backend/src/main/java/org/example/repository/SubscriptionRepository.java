package org.example.repository;


import org.example.dto.EmployeeSalesDTO;
import org.example.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubscriptionRepository
        extends JpaRepository<Subscription, Integer> {
    @Query(value = """
    SELECT
        e.EmployeeId AS employeeId,
        e.FirstName AS firstName,
        e.LastName AS lastName,
        COUNT(s.SubscriptionId) AS salesCount,
        COALESCE(SUM(p.MonthlyPrice + COALESCE(sa.addonTotal, 0)), 0) AS totalSales,
        MAX(s.StartDate) AS lastSaleDate
    FROM subscriptions s
    JOIN employees e
        ON s.SoldByEmployeeId = e.EmployeeId
    JOIN plans p
        ON s.PlanId = p.PlanId
    LEFT JOIN (
        SELECT
            sa.SubscriptionId,
            COALESCE(SUM(a.MonthlyPrice), 0) AS addonTotal
        FROM subscriptionaddons sa
        JOIN addons a
            ON sa.AddOnId = a.AddOnId
        WHERE sa.Status = 'Active'
        GROUP BY sa.SubscriptionId
    ) sa
        ON s.SubscriptionId = sa.SubscriptionId
    WHERE s.SoldByEmployeeId IS NOT NULL
    GROUP BY e.EmployeeId, e.FirstName, e.LastName
    ORDER BY totalSales DESC
    """, nativeQuery = true)
    List<Object[]> getEmployeeSalesSummaryRaw();

    @Query(value = """
    SELECT
        s.SubscriptionId AS subscriptionId,
        s.CustomerId AS customerId,
        s.PlanId AS planId,
        s.Status AS status,
        p.PlanName AS planName,
        p.MonthlyPrice AS monthlyPrice,
        COALESCE(SUM(a.MonthlyPrice), 0) AS addonTotal
    FROM subscriptions s
    JOIN plans p
        ON s.PlanId = p.PlanId
    LEFT JOIN subscriptionaddons sa
        ON s.SubscriptionId = sa.SubscriptionId
       AND sa.Status = 'Active'
    LEFT JOIN addons a
        ON sa.AddOnId = a.AddOnId
    WHERE s.CustomerId = :customerId
      AND s.Status = 'Active'
    GROUP BY
        s.SubscriptionId,
        s.CustomerId,
        s.PlanId,
        s.Status,
        p.PlanName,
        p.MonthlyPrice,
        s.StartDate
    ORDER BY s.StartDate DESC
    """, nativeQuery = true)
    List<Object[]> findActivePlansByCustomerIdRaw(@Param("customerId") Integer customerId);

}



