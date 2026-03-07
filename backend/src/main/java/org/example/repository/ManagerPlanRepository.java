package org.example.repository;

import org.example.dto.ManagerPlanDTO;
import org.example.dto.SaveManagerPlanRequestDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class ManagerPlanRepository {

    private final JdbcTemplate jdbc;

    public ManagerPlanRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private Double asDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.doubleValue();
        return Double.valueOf(value.toString());
    }

    private Integer asInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Boolean b) return b ? 1 : 0;
        if (value instanceof Number n) return n.intValue();
        return Integer.valueOf(value.toString());
    }

    public List<ManagerPlanDTO> findAll() {
        return jdbc.query("""
                SELECT PlanId, ServiceTypeId, PlanName, MonthlyPrice, ContractTermMonths,
                       Description, IsActive, Tagline, Badge, IconKey, ThemeKey, DataLabel
                FROM Plans
                ORDER BY PlanId
                """,
                (rs, rowNum) -> new ManagerPlanDTO(
                        asInteger(rs.getObject("PlanId")),
                        asInteger(rs.getObject("ServiceTypeId")),
                        rs.getString("PlanName"),
                        asDouble(rs.getObject("MonthlyPrice")),
                        asInteger(rs.getObject("ContractTermMonths")),
                        rs.getString("Description"),
                        asInteger(rs.getObject("IsActive")),
                        rs.getString("Tagline"),
                        rs.getString("Badge"),
                        rs.getString("IconKey"),
                        rs.getString("ThemeKey"),
                        rs.getString("DataLabel")
                )
        );
    }

    public ManagerPlanDTO findById(int planId) {
        List<ManagerPlanDTO> rows = jdbc.query("""
                SELECT PlanId, ServiceTypeId, PlanName, MonthlyPrice, ContractTermMonths,
                       Description, IsActive, Tagline, Badge, IconKey, ThemeKey, DataLabel
                FROM Plans
                WHERE PlanId = ?
                """,
                (rs, rowNum) -> new ManagerPlanDTO(
                        asInteger(rs.getObject("PlanId")),
                        asInteger(rs.getObject("ServiceTypeId")),
                        rs.getString("PlanName"),
                        asDouble(rs.getObject("MonthlyPrice")),
                        asInteger(rs.getObject("ContractTermMonths")),
                        rs.getString("Description"),
                        asInteger(rs.getObject("IsActive")),
                        rs.getString("Tagline"),
                        rs.getString("Badge"),
                        rs.getString("IconKey"),
                        rs.getString("ThemeKey"),
                        rs.getString("DataLabel")
                ),
                planId
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    public int create(SaveManagerPlanRequestDTO request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO Plans
                    (ServiceTypeId, PlanName, MonthlyPrice, ContractTermMonths, Description,
                     IsActive, Tagline, Badge, IconKey, ThemeKey, DataLabel)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);

            ps.setObject(1, request.serviceTypeId());
            ps.setString(2, request.planName());
            ps.setObject(3, request.monthlyPrice());
            ps.setObject(4, request.contractTermMonths());
            ps.setString(5, request.description());
            ps.setObject(6, request.isActive());
            ps.setString(7, request.tagline());
            ps.setString(8, request.badge());
            ps.setString(9, request.iconKey());
            ps.setString(10, request.themeKey());
            ps.setString(11, request.dataLabel());

            return ps;
        }, keyHolder);

        return keyHolder.getKey().intValue();
    }

    public int update(int planId, SaveManagerPlanRequestDTO request) {
        return jdbc.update("""
                UPDATE Plans
                SET ServiceTypeId = ?,
                    PlanName = ?,
                    MonthlyPrice = ?,
                    ContractTermMonths = ?,
                    Description = ?,
                    IsActive = ?,
                    Tagline = ?,
                    Badge = ?,
                    IconKey = ?,
                    ThemeKey = ?,
                    DataLabel = ?
                WHERE PlanId = ?
                """,
                request.serviceTypeId(),
                request.planName(),
                request.monthlyPrice(),
                request.contractTermMonths(),
                request.description(),
                request.isActive(),
                request.tagline(),
                request.badge(),
                request.iconKey(),
                request.themeKey(),
                request.dataLabel(),
                planId
        );
    }

    public int delete(int planId) {
        Integer usageCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM Subscriptions WHERE PlanId = ?",
                Integer.class,
                planId
        );

        if (usageCount != null && usageCount > 0) {
            throw new RuntimeException("Cannot delete plan because it is used by active subscriptions.");
        }

        jdbc.update("DELETE FROM PlanAddOns WHERE PlanId = ?", planId);
        jdbc.update("DELETE FROM PlanFeatures WHERE PlanId = ?", planId);

        return jdbc.update("DELETE FROM Plans WHERE PlanId = ?", planId);
    }
}