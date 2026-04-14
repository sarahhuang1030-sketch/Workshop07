//package org.example.repository;
//
//import org.example.entity.Invoices;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//
//import java.util.List;
//
///**
// * Invoice Repository
// */
//public interface InvoiceRepository extends JpaRepository<Invoices, Integer> {
//
//    // ======================================================
//    // BASIC QUERIES
//    // ======================================================
//
//    Invoices findByInvoiceNumber(String invoiceNumber);
//
//    Invoices findTopByCustomerIdOrderByIssueDateDesc(Integer customerId);
//
//    List<Invoices> findByCustomerIdOrderByIssueDateDesc(Integer customerId);
//
//    List<Invoices> findAllByOrderByIssueDateDesc();
//
//    // ======================================================
//    // DASHBOARD
//    // ======================================================
//
//    @Query("""
//        SELECT COUNT(i)
//        FROM Invoices i
//        WHERE i.status = 'Pending'
//    """)
//    long countPendingInvoices();
//
//    // ======================================================
//    // EMPLOYEE SALES (native SQL - FIXED)
//    // ======================================================
//
//    @Query(value = """
//    SELECT
//        e.EmployeeId,
//        e.FirstName,
//        e.LastName,
//        COUNT(i.InvoiceId) AS salesCount,
//        COALESCE(SUM(i.total), 0) AS totalSales,
//        MAX(i.IssueDate) AS lastSaleDate
//    FROM employees e
//    LEFT JOIN customers c
//        ON c.AssignedEmployeeId = e.EmployeeId
//    LEFT JOIN invoices i
//        ON i.CustomerId = c.CustomerId
//       AND i.Status = 'Active'
//    WHERE e.RoleId = 2
//    GROUP BY e.EmployeeId, e.FirstName, e.LastName
//    ORDER BY totalSales DESC, e.FirstName ASC, e.LastName ASC
//    """, nativeQuery = true)
//    List<Object[]> getEmployeeSalesSummaryFromInvoices();
//
//    @Query(value = """
//    SELECT
//        e.EmployeeId,
//        e.FirstName,
//        e.LastName,
//        COUNT(i.InvoiceId) AS salesCount,
//        COALESCE(SUM(i.total), 0) AS totalSales,
//        MAX(i.IssueDate) AS lastSaleDate
//    FROM employees e
//    LEFT JOIN customers c
//        ON c.AssignedEmployeeId = e.EmployeeId
//    LEFT JOIN invoices i
//        ON i.CustomerId = c.CustomerId
//       AND i.Status = 'Active'
//    WHERE e.EmployeeId = :employeeId
//    GROUP BY e.EmployeeId, e.FirstName, e.LastName
//    """, nativeQuery = true)
//    List<Object[]> getEmployeeSalesByEmployeeIdFromInvoices(
//            @Param("employeeId") Integer employeeId
//    );
//
//    @Query(value = """
//    SELECT
//        i.InvoiceId,
//        c.CustomerId,
//        CASE
//            WHEN c.CustomerType = 'Business' THEN c.BusinessName
//            ELSE CONCAT(COALESCE(c.FirstName, ''), ' ', COALESCE(c.LastName, ''))
//        END AS customerName,
//        e.EmployeeId,
//        e.FirstName,
//        e.LastName,
//        COALESCE(i.total, 0) AS totalSales,
//        COALESCE(i.subtotal, 0) AS subtotal,
//        i.IssueDate
//    FROM invoices i
//    JOIN customers c
//        ON i.CustomerId = c.CustomerId
//    JOIN employees e
//        ON c.AssignedEmployeeId = e.EmployeeId
//    WHERE e.EmployeeId = :employeeId
//      AND i.Status = 'Active'
//    ORDER BY i.IssueDate DESC, i.InvoiceId DESC
//    """, nativeQuery = true)
//    List<Object[]> getEmployeeSalesDetailsFromInvoices(
//            @Param("employeeId") Integer employeeId
//    );
//
//    // ======================================================
//    // FETCH JOIN QUERIES (JPQL - FIXED ENTITY NAMES)
//    // ======================================================
//
//    @Query("""
//        SELECT i
//        FROM Invoices i
//        LEFT JOIN FETCH i.paidByAccount
//        WHERE i.invoiceNumber = :invoiceNumber
//    """)
//    Invoices findWithPaymentByInvoiceNumber(@Param("invoiceNumber") String invoiceNumber);
//
//    @Query("""
//        SELECT i
//        FROM Invoices i
//        LEFT JOIN FETCH i.paidByAccount
//        LEFT JOIN FETCH i.items
//        WHERE i.invoiceNumber = :invoiceNumber
//    """)
//    Invoices findFullByInvoiceNumber(@Param("invoiceNumber") String invoiceNumber);
//
//    @Query("""
//        SELECT i
//        FROM Invoices i
//        LEFT JOIN FETCH i.paidByAccount
//        WHERE i.customerId = :customerId
//        ORDER BY i.issueDate DESC
//    """)
//    List<Invoices> findByCustomerIdWithPayment(@Param("customerId") Integer customerId);
//
//    @Query("""
//        SELECT i
//        FROM Invoices i
//        LEFT JOIN FETCH i.paidByAccount
//        ORDER BY i.issueDate DESC
//    """)
//    List<Invoices> findAllWithPayment();
//}

package org.example.repository;

import org.example.entity.Invoices;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

/**
 * Invoice Repository
 * SaaS Standard Version:
 * - Unified field: status
 * - Supports Quote → Invoice → Payment lifecycle
 * - Supports Stripe integration
 */
public interface InvoiceRepository extends JpaRepository<Invoices, Integer> {

    // ======================================================
    // BASIC QUERIES
    // ======================================================

    /**
     * Find invoice by invoice number
     */
    Invoices findByInvoiceNumber(String invoiceNumber);

    /**
     * Get latest invoice for a customer
     */
    Invoices findTopByCustomerIdOrderByIssueDateDesc(Integer customerId);

    /**
     * Get all invoices for a customer ordered by latest first
     */
    List<Invoices> findByCustomerIdOrderByIssueDateDesc(Integer customerId);

    /**
     * Get all invoices ordered by latest first
     */
    List<Invoices> findAllByOrderByIssueDateDesc();
    Invoices findTopByCustomerIdOrderByIssueDateDescInvoiceIdDesc(Integer customerId);

    /**
     * Get employee invoices based on subscription
     */
    List<Invoices> findBySubscriptionIdIn(List<Integer> subscriptionIds);

    List<Invoices> findByIssueDateBetween(LocalDate start, LocalDate end);

    // ======================================================
    // DASHBOARD
    // ======================================================

    /**
     * Count all pending invoices
     * SaaS status lifecycle: PENDING → APPROVED → PAID
     */
    @Query("""
        SELECT COUNT(i)
        FROM Invoices i
        WHERE i.status = 'PENDING'
    """)
    long countPendingInvoices();


    // ======================================================
    // EMPLOYEE SALES (SAAS FIXED)
    // Only PAID invoices count as revenue
    // ======================================================

    /**
     * Get total sales summary per employee (PAID invoices only)
     */
    @Query(value = """
    SELECT
        e.EmployeeId,
        e.FirstName,
        e.LastName,
        COUNT(i.InvoiceId) AS salesCount,
        COALESCE(SUM(i.total), 0) AS totalSales,
        MAX(i.IssueDate) AS lastSaleDate
    FROM employees e
    LEFT JOIN customers c
        ON c.AssignedEmployeeId = e.EmployeeId
    LEFT JOIN invoices i
        ON i.CustomerId = c.CustomerId
       AND i.status = 'PAID'
    WHERE e.RoleId = 2
    GROUP BY e.EmployeeId, e.FirstName, e.LastName
    ORDER BY totalSales DESC, e.FirstName ASC, e.LastName ASC
    """, nativeQuery = true)
    List<Object[]> getEmployeeSalesSummaryFromInvoices();


    /**
     * Get sales summary for specific employee
     */
    @Query(value = """
    SELECT
        e.EmployeeId,
        e.FirstName,
        e.LastName,
        COUNT(i.InvoiceId) AS salesCount,
        COALESCE(SUM(i.total), 0) AS totalSales,
        MAX(i.IssueDate) AS lastSaleDate
    FROM employees e
    LEFT JOIN customers c
        ON c.AssignedEmployeeId = e.EmployeeId
    LEFT JOIN invoices i
        ON i.CustomerId = c.CustomerId
       AND i.status = 'PAID'
    WHERE e.EmployeeId = :employeeId
    GROUP BY e.EmployeeId, e.FirstName, e.LastName
    """, nativeQuery = true)
    List<Object[]> getEmployeeSalesByEmployeeIdFromInvoices(
            @Param("employeeId") Integer employeeId
    );


    /**
     * Get detailed sales records for an employee (PAID invoices only)
     */
    @Query(value = """
    SELECT
        i.InvoiceId,
        c.CustomerId,
        CASE
            WHEN c.CustomerType = 'Business' THEN c.BusinessName
            ELSE CONCAT(COALESCE(c.FirstName, ''), ' ', COALESCE(c.LastName, ''))
        END AS customerName,
        e.EmployeeId,
        e.FirstName,
        e.LastName,
        COALESCE(i.total, 0) AS totalSales,
        COALESCE(i.subtotal, 0) AS subtotal,
        i.IssueDate
    FROM invoices i
    JOIN customers c
        ON i.CustomerId = c.CustomerId
    JOIN employees e
        ON c.AssignedEmployeeId = e.EmployeeId
    WHERE e.EmployeeId = :employeeId
      AND i.status = 'PAID'
    ORDER BY i.IssueDate DESC, i.InvoiceId DESC
    """, nativeQuery = true)
    List<Object[]> getEmployeeSalesDetailsFromInvoices(
            @Param("employeeId") Integer employeeId
    );


    // ======================================================
    // FETCH JOIN QUERIES (JPA)
    // ======================================================

    /**
     * Find invoice with payment relation
     */
    @Query("""
        SELECT i
        FROM Invoices i
        LEFT JOIN FETCH i.paidByAccount
        WHERE i.invoiceNumber = :invoiceNumber
    """)
    Invoices findWithPaymentByInvoiceNumber(@Param("invoiceNumber") String invoiceNumber);


    /**
     * Find full invoice detail (payment + items)
     */
    @Query("""
        SELECT i
        FROM Invoices i
        LEFT JOIN FETCH i.paidByAccount
        LEFT JOIN FETCH i.items
        WHERE i.invoiceNumber = :invoiceNumber
    """)
    Invoices findFullByInvoiceNumber(@Param("invoiceNumber") String invoiceNumber);


    /**
     * Get customer invoices with payment info
     */
    @Query("""
        SELECT i
        FROM Invoices i
        LEFT JOIN FETCH i.paidByAccount
        WHERE i.customerId = :customerId
        ORDER BY i.issueDate DESC
    """)
    List<Invoices> findByCustomerIdWithPayment(@Param("customerId") Integer customerId);


    /**
     * Get all invoices with payment info
     */
    @Query("""
        SELECT i
        FROM Invoices i
        LEFT JOIN FETCH i.paidByAccount
        ORDER BY i.issueDate DESC
    """)
    List<Invoices> findAllWithPayment();
}