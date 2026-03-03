package org.example.repository;

import org.example.dto.CurrentPlanDTO;
import org.example.dto.LastPaymentDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class MeRepository {

    private final JdbcTemplate jdbc;

    public MeRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Integer> findCustomerIdByUsername(String username) {
        return jdbc.query("""
                SELECT CustomerId
                FROM UserAccounts
                WHERE Username = ?
                """,
                rs -> rs.next() ? Optional.of(rs.getInt("CustomerId")) : Optional.empty(),
                username
        );
    }

    public Optional<CurrentPlanDTO> findActivePlanForCustomer(int customerId) {
        return jdbc.query("""
                SELECT
                    s.Status      AS status,
                    p.PlanName    AS name,
                    p.MonthlyPrice AS monthlyPrice,
                    s.StartDate   AS startedAt
                FROM Subscriptions s
                JOIN Plans p ON p.PlanId = s.PlanId
                WHERE s.CustomerId = ?
                  AND s.Status = 'Active'
                ORDER BY s.StartDate DESC
                LIMIT 1
                """,
                rs -> {
                    if (!rs.next()) return Optional.empty();
                    return Optional.of(new CurrentPlanDTO(
                            rs.getString("status"),
                            rs.getString("name"),
                            rs.getDouble("monthlyPrice"),
                            rs.getDate("startedAt").toLocalDate()
                    ));
                },
                customerId
        );
    }

    public Optional<LastPaymentDTO> findLastCompletedPayment(int customerId) {
        return jdbc.query("""
                SELECT Amount, PaymentDate, Method, Status
                FROM Payments
                WHERE CustomerId = ?
                  AND Status = 'Completed'
                ORDER BY PaymentDate DESC
                LIMIT 1
                """,
                rs -> {
                    if (!rs.next()) return Optional.empty();
                    return Optional.of(new LastPaymentDTO(
                            rs.getDouble("Amount"),
                            rs.getTimestamp("PaymentDate").toLocalDateTime(),
                            rs.getString("Method"),
                            rs.getString("Status")
                    ));
                },
                customerId
        );
    }


    public Optional<Integer> findActiveSubscriptionId(int customerId) {
        return jdbc.query("""
            SELECT SubscriptionId
            FROM Subscriptions
            WHERE CustomerId = ?
              AND Status = 'Active'
            ORDER BY StartDate DESC
            LIMIT 1
            """,
                rs -> rs.next() ? Optional.of(rs.getInt("SubscriptionId")) : Optional.empty(),
                customerId
        );
    }

    public Map<String, Object> findSubscriptionRow(int subscriptionId) {
        return jdbc.query("""
            SELECT SubscriptionId, CustomerId, PlanId, StartDate, EndDate, Status, BillingCycleDay, Notes
            FROM Subscriptions
            WHERE SubscriptionId = ?
            """,
                rs -> {
                    if (!rs.next()) return Map.of();
                    Map<String, Object> s = new LinkedHashMap<>();
                    s.put("subscriptionId", rs.getInt("SubscriptionId"));
                    s.put("customerId", rs.getInt("CustomerId"));
                    s.put("planId", rs.getInt("PlanId"));
                    s.put("startDate", rs.getDate("StartDate"));
                    s.put("endDate", rs.getDate("EndDate"));
                    s.put("status", rs.getString("Status"));
                    s.put("billingCycleDay", rs.getObject("BillingCycleDay"));
                    s.put("notes", rs.getString("Notes"));
                    return s;
                },
                subscriptionId
        );
    }

    public Map<String, Object> findPlanInfo(int planId) {
        return jdbc.query("""
            SELECT PlanId, PlanName, MonthlyPrice, Description
            FROM Plans
            WHERE PlanId = ?
            """,
                rs -> {
                    if (!rs.next()) return Map.of();
                    Map<String, Object> p = new LinkedHashMap<>();
                    p.put("planId", rs.getInt("PlanId"));
                    p.put("planName", rs.getString("PlanName"));
                    p.put("monthlyPrice", rs.getDouble("MonthlyPrice"));
                    p.put("description", rs.getString("Description"));
                    return p;
                },
                planId
        );
    }

    public List<Map<String, Object>> findPlanFeatures(int planId) {
        return jdbc.query("""
            SELECT FeatureName, FeatureValue, Unit, SortOrder
            FROM PlanFeatures
            WHERE PlanId = ?
            ORDER BY SortOrder, FeatureId
            """,
                (rs, rowNum) -> {
                    Map<String, Object> f = new LinkedHashMap<>();
                    f.put("name", rs.getString("FeatureName"));
                    f.put("value", rs.getString("FeatureValue"));
                    f.put("unit", rs.getString("Unit"));
                    f.put("sortOrder", rs.getInt("SortOrder"));
                    return f;
                },
                planId
        );
    }

    // IMPORTANT: only works if you REALLY have SubscriptionAddOns table
    public List<Map<String, Object>> findPurchasedAddOns(int subscriptionId) {
        return jdbc.query("""
            SELECT a.AddOnId, a.AddOnName, a.MonthlyPrice, a.Description
            FROM SubscriptionAddOns sa
            JOIN AddOns a ON a.AddOnId = sa.AddOnId
            WHERE sa.SubscriptionId = ?
            ORDER BY a.AddOnName
            """,
                (rs, rowNum) -> {
                    Map<String, Object> a = new LinkedHashMap<>();
                    a.put("addOnId", rs.getInt("AddOnId"));
                    a.put("addOnName", rs.getString("AddOnName"));
                    a.put("monthlyPrice", rs.getDouble("MonthlyPrice"));
                    a.put("description", rs.getString("Description"));
                    return a;
                },
                subscriptionId
        );
    }

    public List<Map<String, Object>> findRecentPayments(int customerId, int limit) {
        return jdbc.query("""
            SELECT PaymentId, Amount, PaymentDate, Method, Status
            FROM Payments
            WHERE CustomerId = ?
            ORDER BY PaymentDate DESC
            LIMIT ?
            """,
                (rs, rowNum) -> {
                    Map<String, Object> p = new LinkedHashMap<>();
                    p.put("paymentId", rs.getInt("PaymentId"));
                    p.put("amount", rs.getDouble("Amount"));
                    p.put("paymentDate", rs.getTimestamp("PaymentDate"));
                    p.put("method", rs.getString("Method"));
                    p.put("status", rs.getString("Status"));
                    return p;
                },
                customerId, limit
        );
    }
}
