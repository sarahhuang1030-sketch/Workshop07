package org.example.repository;

import org.example.dto.AddOnDTO;
import org.example.dto.PlanFeatureDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class PlanRepository {
    private final JdbcTemplate jdbc;

    public PlanRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<PlanRow> findPlansByServiceTypeName(String typeName) {
        return jdbc.query("""
                SELECT p.PlanId, p.PlanName, p.MonthlyPrice, p.Description
                FROM Plans p
                JOIN ServiceTypes s ON s.ServiceTypeId = p.ServiceTypeId
                WHERE LOWER(TRIM(s.Name)) = LOWER(TRIM(?))
                  AND p.IsActive = TRUE
                ORDER BY p.PlanId
                """,
                (rs, rowNum) -> new PlanRow(
                        rs.getInt("PlanId"),
                        rs.getString("PlanName"),
                        rs.getDouble("MonthlyPrice"),
                        rs.getString("Description")
                ),
                typeName
        );
    }

    // Fetch all PlanFeatures for many planIds at once
    public Map<Integer, List<PlanFeatureRow>> findPlanFeaturesByPlanIds(List<Integer> planIds) {
        if (planIds.isEmpty()) return Map.of();

        String placeholders = String.join(",", Collections.nCopies(planIds.size(), "?"));

        String sql =
                "SELECT PlanId, FeatureName, FeatureValue, Unit, SortOrder, FeatureId " +
                        "FROM PlanFeatures " +
                        "WHERE PlanId IN (" + placeholders + ") " +
                        "ORDER BY PlanId, SortOrder, FeatureId";

        List<PlanFeatureRow> rows = jdbc.query(
                sql,
                (rs, rowNum) -> new PlanFeatureRow(
                        rs.getInt("PlanId"),
                        rs.getString("FeatureName"),
                        rs.getString("FeatureValue"),
                        rs.getString("Unit"),
                        rs.getInt("SortOrder"),
                        rs.getInt("FeatureId")
                ),
                planIds.toArray()
        );

        Map<Integer, List<PlanFeatureRow>> map = new HashMap<>();
        for (PlanFeatureRow r : rows) {
            map.computeIfAbsent(r.planId(), k -> new ArrayList<>()).add(r);
        }
        return map;
    }

    // Fetch all allowed add-ons for many planIds at once
    public Map<Integer, List<AddOnDTO>> findAddOnsByPlanIds(List<Integer> planIds) {
        if (planIds.isEmpty()) return Map.of();

        String placeholders = String.join(",", Collections.nCopies(planIds.size(), "?"));

        String sql =
                "SELECT pa.PlanId, a.AddOnId, a.AddOnName, a.MonthlyPrice, a.Description " +
                        "FROM PlanAddOns pa " +
                        "JOIN AddOns a ON a.AddOnId = pa.AddOnId " +
                        "WHERE pa.PlanId IN (" + placeholders + ") " +
                        "AND a.IsActive = TRUE " +
                        "ORDER BY pa.PlanId, a.AddOnName";

        List<PlanAddOnRow> rows = jdbc.query(
                sql,
                (rs, rowNum) -> new PlanAddOnRow(
                        rs.getInt("PlanId"),
                        new AddOnDTO(
                                rs.getInt("AddOnId"),
                                rs.getString("AddOnName"),
                                rs.getDouble("MonthlyPrice"),
                                rs.getString("Description")
                        )
                ),
                planIds.toArray()
        );


        Map<Integer, List<AddOnDTO>> map = new HashMap<>();
        for (PlanAddOnRow r : rows) {
            map.computeIfAbsent(r.planId(), k -> new ArrayList<>()).add(r.addOn());
        }
        return map;
    }

    public record PlanRow(int planId, String planName, double monthlyPrice, String tagline) {}
    public record PlanFeatureRow(int planId, String featureName, String featureValue, String unit, int sortOrder, int featureId) {}
    public record PlanAddOnRow(int planId, AddOnDTO addOn) {}
}
