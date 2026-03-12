package org.example.repository;

import org.example.dto.ManagerReportSummaryDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public class ManagerReportRepository {

    private final JdbcTemplate jdbc;

    public ManagerReportRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public ManagerReportSummaryDTO getSummary() {
        ManagerReportSummaryDTO dto = new ManagerReportSummaryDTO();

        Long totalCustomers = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM Customers
                """, Long.class);

        Long activeSubscriptions = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM subscriptions
                WHERE Status = 'Active'
                """, Long.class);

        Long suspendedSubscriptions = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM subscriptions
                WHERE Status = 'Suspended'
                """, Long.class);

        Long openInvoices = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM invoices
                WHERE Status = 'Open'
                """, Long.class);

        Double estimatedMonthlyRevenue = jdbc.queryForObject("""
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
                """, Double.class);

        Long totalAddons = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM addons
                """, Long.class);

        Long activeAddons = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM addons
                WHERE IsActive = TRUE
                """, Long.class);

        dto.setTotalCustomers(totalCustomers != null ? totalCustomers : 0);
        dto.setActiveSubscriptions(activeSubscriptions != null ? activeSubscriptions : 0);
        dto.setSuspendedSubscriptions(suspendedSubscriptions != null ? suspendedSubscriptions : 0);
        dto.setOpenInvoices(openInvoices != null ? openInvoices : 0);
        dto.setEstimatedMonthlyRevenue(BigDecimal.valueOf(estimatedMonthlyRevenue != null ? estimatedMonthlyRevenue : 0.0));
        dto.setTotalAddons(totalAddons != null ? totalAddons : 0);
        dto.setActiveAddons(activeAddons != null ? activeAddons : 0);

        return dto;
    }
}
