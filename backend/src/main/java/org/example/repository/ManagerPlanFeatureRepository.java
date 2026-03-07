package org.example.repository;

import org.example.dto.ManagerPlanFeatureDTO;
import org.example.dto.SavePlanFeatureRequestDTO;
import org.example.dto.FeatureTemplateDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class ManagerPlanFeatureRepository {

    private final JdbcTemplate jdbc;

    public ManagerPlanFeatureRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        return Integer.valueOf(value.toString());
    }

    public List<ManagerPlanFeatureDTO> findByPlanId(int planId) {
        return jdbc.query("""
                SELECT FeatureId, PlanId, FeatureName, FeatureValue, Unit, SortOrder
                FROM PlanFeatures
                WHERE PlanId = ?
                ORDER BY SortOrder, FeatureId
                """,
                (rs, rowNum) -> new ManagerPlanFeatureDTO(
                        toInteger(rs.getObject("FeatureId")),
                        toInteger(rs.getObject("PlanId")),
                        rs.getString("FeatureName"),
                        rs.getString("FeatureValue"),
                        rs.getString("Unit"),
                        toInteger(rs.getObject("SortOrder"))
                ),
                planId
        );
    }

    public ManagerPlanFeatureDTO findById(int featureId) {
        List<ManagerPlanFeatureDTO> rows = jdbc.query("""
                SELECT FeatureId, PlanId, FeatureName, FeatureValue, Unit, SortOrder
                FROM PlanFeatures
                WHERE FeatureId = ?
                """,
                (rs, rowNum) -> new ManagerPlanFeatureDTO(
                        toInteger(rs.getObject("FeatureId")),
                        toInteger(rs.getObject("PlanId")),
                        rs.getString("FeatureName"),
                        rs.getString("FeatureValue"),
                        rs.getString("Unit"),
                        toInteger(rs.getObject("SortOrder"))
                ),
                featureId
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    public int create(SavePlanFeatureRequestDTO request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
                    VALUES (?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);

            ps.setObject(1, request.planId());
            ps.setString(2, request.featureName());
            ps.setString(3, request.featureValue());
            ps.setString(4, request.unit());
            ps.setObject(5, request.sortOrder());

            return ps;
        }, keyHolder);

        return keyHolder.getKey().intValue();
    }

    public int update(int featureId, SavePlanFeatureRequestDTO request) {
        return jdbc.update("""
                UPDATE PlanFeatures
                SET PlanId = ?,
                    FeatureName = ?,
                    FeatureValue = ?,
                    Unit = ?,
                    SortOrder = ?
                WHERE FeatureId = ?
                """,
                request.planId(),
                request.featureName(),
                request.featureValue(),
                request.unit(),
                request.sortOrder(),
                featureId
        );
    }

    public int delete(int featureId) {
        return jdbc.update("DELETE FROM PlanFeatures WHERE FeatureId = ?", featureId);
    }

    public List<FeatureTemplateDTO> findFeatureTemplates() {
        return jdbc.query("""
            SELECT DISTINCT FeatureName, FeatureValue, Unit
            FROM PlanFeatures
            ORDER BY FeatureName, FeatureValue
            """,
                (rs, rowNum) -> new FeatureTemplateDTO(
                        rs.getString("FeatureName"),
                        rs.getString("FeatureValue"),
                        rs.getString("Unit")
                )
        );
    }
}