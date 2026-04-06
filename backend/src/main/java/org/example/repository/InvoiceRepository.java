package org.example.repository;

import org.example.entity.Invoices;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

// Repository for Invoices entity
public interface InvoiceRepository extends JpaRepository<Invoices, Integer> {

    // Find single invoice by invoice number
    Invoices findByInvoiceNumber(String invoiceNumber);

    // Find latest invoice for a customer
    Invoices findTopByCustomerIdOrderByIssueDateDesc(Integer customerId);

    // Find all invoices for a customer, ordered by issue date descending
    List<Invoices> findByCustomerIdOrderByIssueDateDesc(Integer customerId);

    // Find all invoices ordered by date**
    List<Invoices> findAllByOrderByIssueDateDesc();

    @Query("SELECT COUNT(i) FROM Invoices i WHERE i.status = 'Pending'")
    long countPendingInvoices();

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
       AND i.Status = 'Active'
    WHERE e.RoleId = 2
    GROUP BY e.EmployeeId, e.FirstName, e.LastName
    ORDER BY totalSales DESC, e.FirstName ASC, e.LastName ASC
    """, nativeQuery = true)
    List<Object[]> getEmployeeSalesSummaryFromInvoices();

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
       AND i.Status = 'Active'
    WHERE e.EmployeeId = :employeeId
    GROUP BY e.EmployeeId, e.FirstName, e.LastName
    """, nativeQuery = true)
    List<Object[]> getEmployeeSalesByEmployeeIdFromInvoices(Integer employeeId);


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
      AND i.Status = 'Active'
    ORDER BY i.IssueDate DESC, i.InvoiceId DESC
    """, nativeQuery = true)
    List<Object[]> getEmployeeSalesDetailsFromInvoices(Integer employeeId);
}