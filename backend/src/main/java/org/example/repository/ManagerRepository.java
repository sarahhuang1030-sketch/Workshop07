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

    @Query(value = """
    SELECT COUNT(*)
    FROM invoices
    WHERE Status NOT IN ('Paid', 'Success', 'Approved')
      AND DueDate < CURDATE()
""", nativeQuery = true)
    long countPastDueInvoices();

    @Query(value = "SELECT COUNT(*) FROM subscriptions WHERE Status = 'Suspended'", nativeQuery = true)
    long countSuspendedSubscriptions();

    @Query(value = """
    SELECT COALESCE(SUM(i.total), 0)
    FROM invoices i
    WHERE YEAR(i.IssueDate) = YEAR(CURDATE())
      AND MONTH(i.IssueDate) = MONTH(CURDATE())
    """, nativeQuery = true)
    BigDecimal calculateMonthlyRevenue();


@Query(value = "SELECT COUNT(*) FROM addons", nativeQuery = true)
long countAddOns();

@Query(value = "SELECT COUNT(*) FROM locations", nativeQuery = true)
long countLocations();

@Query(value = "SELECT COUNT(*) FROM planfeatures", nativeQuery = true)
long countPlanFeatures();

@Query(value = "SELECT COUNT(*) FROM locations WHERE IsActive = 1", nativeQuery = true)
long countActiveLocations();

@Query(value = "SELECT COUNT(*) FROM servicerequests", nativeQuery = true)
long countServiceRequests();

@Query(value = "SELECT COUNT(*) FROM serviceappointments", nativeQuery = true)
long countServiceAppointments();

}