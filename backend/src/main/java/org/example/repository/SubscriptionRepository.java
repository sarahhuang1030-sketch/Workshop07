package org.example.repository;

import org.example.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Integer> {

    /**
     * Get overall employee sales ranking
     */
    @Query(value = """
        SELECT
            e.EmployeeId AS employeeId,
            e.FirstName AS firstName,
            e.LastName AS lastName,
            COUNT(s.SubscriptionId) AS salesCount,

            COALESCE(
                SUM(
                    COALESCE(p.MonthlyPrice, 0)
                    + COALESCE(sa.addonTotal, 0)
                ),
            0) AS totalSales,

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

    /**
     * Get active plans for a customer
     */
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
            s.StartDat
        ORDER BY s.StartDate DESC
    """, nativeQuery = true)
    List<Object[]> findActivePlansByCustomerIdRaw(@Param("customerId") Integer customerId);

    /**
     * Get sales summary for ONE employee (/my-sales)
     */
    @Query(value = """
        SELECT
            e.EmployeeId AS employeeId,
            e.FirstName AS firstName,
            e.LastName AS lastName,
            COUNT(s.SubscriptionId) AS salesCount,

            COALESCE(
                SUM(
                    COALESCE(p.MonthlyPrice, 0)
                    + COALESCE(sa.addonTotal, 0)
                ),
            0) AS totalSales,

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
        WHERE s.SoldByEmployeeId = :employeeId
        GROUP BY e.EmployeeId, e.FirstName, e.LastName
    """, nativeQuery = true)
    List<Object[]> getEmployeeSalesByEmployeeId(@Param("employeeId") Integer employeeId);

    /**
     * Get each sale detail for ONE employee (/my-sales/details)
     */
    @Query(value = """
        SELECT
            s.SubscriptionId,
            s.CustomerId,
            u.Username AS customerName,
            s.PlanId,
            s.Status,
            p.PlanName,
            p.MonthlyPrice,
            COALESCE(SUM(a.MonthlyPrice), 0) AS addonTotal,
            s.StartDate
        FROM subscriptions s
        JOIN plans p
            ON s.PlanId = p.PlanId
        LEFT JOIN useraccounts u
            ON s.CustomerId = u.UserId
        LEFT JOIN subscriptionaddons sa
            ON s.SubscriptionId = sa.SubscriptionId
           AND sa.Status = 'Active'
        LEFT JOIN addons a
            ON sa.AddOnId = a.AddOnId
        WHERE s.SoldByEmployeeId = :employeeId
        GROUP BY
            s.SubscriptionId,
            s.CustomerId,
            u.Username,
            s.PlanId,
            s.Status,
            p.PlanName,
            p.MonthlyPrice,
            s.StartDate
        ORDER BY s.StartDate DESC
    """, nativeQuery = true)
    List<Object[]> getEmployeeSalesDetails(@Param("employeeId") Integer employeeId);

    @Query(value = """
    SELECT
        s.SubscriptionId,
        p.PlanId,
        p.PlanName,
        p.MonthlyPrice,
        COALESCE(SUM(a.MonthlyPrice), 0) AS addonTotal,
        (p.MonthlyPrice + COALESCE(SUM(a.MonthlyPrice), 0)) AS totalMonthlyPrice,
        s.StartDate,
        p.ContractTermMonths
    FROM subscriptions s
    JOIN plans p
        ON s.PlanId = p.PlanId
    LEFT JOIN subscriptionaddons sa
        ON sa.SubscriptionId = s.SubscriptionId
        AND sa.Status = 'Active'
    LEFT JOIN addons a
        ON sa.AddOnId = a.AddOnId
    WHERE s.CustomerId = :customerId
      AND s.Status = 'Active'
    GROUP BY 
        s.SubscriptionId, 
        p.PlanId, 
        p.PlanName, 
        p.MonthlyPrice, 
        s.StartDate,
        p.ContractTermMonths
""", nativeQuery = true)
    List<Object[]> findActivePlansByCustomerId(@Param("customerId") Integer customerId);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'Active'")
    long countActiveSubscriptions();

    List<Subscription> findByCustomerIdAndStatus(Integer customerId, String status);

    @Query(value = """
        SELECT 
            s.SubscriptionId,
            s.CustomerId,
            s.PlanId,
            s.StartDate,
            s.EndDate,
            s.Status,
            s.BillingCycleDay,
            s.Notes,
            c.CustomerId AS c_id,
            c.BusinessName,
            c.FirstName,
            c.LastName,
            p.PlanId AS p_id,
            p.PlanName,
            p.MonthlyPrice
        FROM subscriptions s
        JOIN customers c ON c.CustomerId = s.CustomerId
        JOIN plans p ON p.PlanId = s.PlanId
    """, nativeQuery = true)
    List<Object[]> findAllWithRelationsRaw();

    // employee-sales
    @Query("SELECT s FROM Subscription s WHERE s.soldByEmployeeId = :employeeId AND s.startDate >= :start AND s.startDate <= :end")
    List<Subscription> findByEmployeeIdAndDateRange(
            @Param("employeeId") Integer employeeId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

//    @Query(value = "SELECT s.* FROM subscriptions s " +
//            "JOIN invoices i ON i.subscription_id = s.SubscriptionId " +
//            "JOIN useraccounts ua ON ua.CustomerId = i.CustomerId " +
//            "WHERE ua.EmployeeId = :employeeId",
//            nativeQuery = true)
//    List<Subscription> findByEmployeeId(@Param("employeeId") Integer employeeId);

    @Query("SELECT s FROM Subscription s WHERE s.soldByEmployeeId = :employeeId")
    List<Subscription> findAllBySoldByEmployeeId(@Param("employeeId") Integer employeeId);
}