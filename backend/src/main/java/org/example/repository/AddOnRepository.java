package org.example.repository;

import org.example.dto.AddOnDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class AddOnRepository {
    private final JdbcTemplate jdbc;

    public AddOnRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<AddOnDTO> findAllActiveAddOns() {
        return jdbc.query("""
                SELECT AddOnId,
                       AddOnName,
                       MonthlyPrice,
                       Description,
                       IsActive
                FROM AddOns
                WHERE IsActive = TRUE
                ORDER BY AddOnName
                """,
                (rs, rowNum) -> new AddOnDTO(
                        rs.getInt("AddOnId"),
                        rs.getString("AddOnName"),
                        rs.getDouble("MonthlyPrice"),
                        rs.getString("Description"),
                        rs.getBoolean("IsActive")
                )
        );
    }

    public List<AddOnDTO> findActiveAddOnsByPlanId(int planId) {
        return jdbc.query("""
                SELECT a.AddOnId,
                       a.AddOnName,
                       a.MonthlyPrice,
                       a.Description,
                       a.IsActive
                FROM PlanAddOns pa
                INNER JOIN AddOns a ON a.AddOnId = pa.AddOnId
                WHERE pa.PlanId = ?
                  AND a.IsActive = TRUE
                ORDER BY a.AddOnName
                """,
                (rs, rowNum) -> new AddOnDTO(
                        rs.getInt("AddOnId"),
                        rs.getString("AddOnName"),
                        rs.getDouble("MonthlyPrice"),
                        rs.getString("Description"),
                        rs.getBoolean("IsActive")
                ),
                planId
        );
    }

    public long countActiveAddons() {
        Long count = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM AddOns
                WHERE IsActive = TRUE
                """, Long.class);

        return count != null ? count : 0L;
    }

    public AddOnDTO findById(Integer id) {
        List<AddOnDTO> list = jdbc.query("""
                SELECT AddOnId,
                       AddOnName,
                       MonthlyPrice,
                       Description,
                       IsActive
                FROM AddOns
                WHERE AddOnId = ?
                """,
                (rs, rowNum) -> new AddOnDTO(
                        rs.getInt("AddOnId"),
                        rs.getString("AddOnName"),
                        rs.getDouble("MonthlyPrice"),
                        rs.getString("Description"),
                        rs.getBoolean("IsActive")
                ),
                id
        );

        return list.isEmpty() ? null : list.get(0);
    }

    public int create(AddOnDTO dto) {
        return jdbc.update("""
                INSERT INTO AddOns (
                    AddOnName,
                    MonthlyPrice,
                    Description,
                    IsActive
                )
                VALUES (?, ?, ?, ?)
                """,
                dto.addOnName(),
                dto.monthlyPrice(),
                dto.description(),
                dto.isActive() != null && dto.isActive()
        );
    }

    public int update(Integer id, AddOnDTO dto) {
        return jdbc.update("""
                UPDATE AddOns
                SET AddOnName = ?,
                    MonthlyPrice = ?,
                    Description = ?,
                    IsActive = ?
                WHERE AddOnId = ?
                """,
                dto.addOnName(),
                dto.monthlyPrice(),
                dto.description(),
                dto.isActive() != null && dto.isActive(),
                id
        );
    }

    public int delete(Integer id) {
        return jdbc.update("""
                DELETE FROM AddOns
                WHERE AddOnId = ?
                """,
                id
        );
    }

    public int attachToPlan(Integer planId, Integer addOnId) {
        return jdbc.update("""
                INSERT INTO PlanAddOns (PlanId, AddOnId)
                VALUES (?, ?)
                """,
                planId, addOnId
        );
    }

    public int removeFromPlan(Integer planId, Integer addOnId) {
        return jdbc.update("""
                DELETE FROM PlanAddOns
                WHERE PlanId = ? AND AddOnId = ?
                """,
                planId, addOnId
        );
    }
}