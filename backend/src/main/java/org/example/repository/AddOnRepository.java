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
                SELECT AddOnId, AddOnName, MonthlyPrice, Description
                FROM AddOns
                WHERE IsActive = TRUE
                ORDER BY AddOnName
                """,
                (rs, rowNum) -> new AddOnDTO(
                        rs.getInt("AddOnId"),
                        rs.getString("AddOnName"),
                        rs.getDouble("MonthlyPrice"),
                        rs.getString("Description")
                )
        );
    }

    public List<AddOnDTO> findActiveAddOnsByPlanId(int planId) {
        return jdbc.query("""
                SELECT a.AddOnId, a.AddOnName, a.MonthlyPrice, a.Description
                FROM PlanAddOns pa
                JOIN AddOns a ON a.AddOnId = pa.AddOnId
                WHERE pa.PlanId = ?
                  AND a.IsActive = TRUE
                ORDER BY a.AddOnName
                """,
                (rs, rowNum) -> new AddOnDTO(
                        rs.getInt("AddOnId"),
                        rs.getString("AddOnName"),
                        rs.getDouble("MonthlyPrice"),
                        rs.getString("Description")
                ),
                planId
        );
    }
}
