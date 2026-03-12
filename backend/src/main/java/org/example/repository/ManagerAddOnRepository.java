package org.example.repository;

import org.example.dto.ManagerAddOnDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ManagerAddOnRepository {

    private final JdbcTemplate jdbc;

    public ManagerAddOnRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<ManagerAddOnDTO> findAll() {
        return jdbc.query("""
            SELECT
                AddOnId,
                ServiceTypeId,
                AddOnName,
                MonthlyPrice,
                Description,
                IsActive,
                IconKey,
                ThemeKey
            FROM AddOns
            ORDER BY AddOnName
        """,
                (rs, rowNum) -> new ManagerAddOnDTO(
                        rs.getInt("AddOnId"),
                        rs.getInt("ServiceTypeId"),
                        rs.getString("AddOnName"),
                        rs.getDouble("MonthlyPrice"),
                        rs.getString("Description"),
                        rs.getBoolean("IsActive"),
                        rs.getString("IconKey"),
                        rs.getString("ThemeKey")
                ));
    }

    public void updateActive(int addOnId, boolean active) {
        jdbc.update("""
            UPDATE AddOns
            SET IsActive = ?
            WHERE AddOnId = ?
        """, active, addOnId);
    }

    public void create(
            Integer serviceTypeId,
            String name,
            double price,
            String description
    ) {
        jdbc.update("""
            INSERT INTO AddOns
            (ServiceTypeId, AddOnName, MonthlyPrice, Description, IsActive)
            VALUES (?, ?, ?, ?, TRUE)
        """,
                serviceTypeId,
                name,
                price,
                description
        );
    }

    public void update(
            int addOnId,
            Integer serviceTypeId,
            String name,
            double price,
            String description
    ) {
        jdbc.update("""
            UPDATE AddOns
            SET ServiceTypeId = ?,
                AddOnName = ?,
                MonthlyPrice = ?,
                Description = ?
            WHERE AddOnId = ?
        """,
                serviceTypeId,
                name,
                price,
                description,
                addOnId
        );
    }

    public ManagerAddOnDTO findById(int addOnId) {
        return jdbc.queryForObject("""
        SELECT
            AddOnId,
            ServiceTypeId,
            AddOnName,
            MonthlyPrice,
            Description,
            IsActive,
            IconKey,
            ThemeKey
        FROM AddOns
        WHERE AddOnId = ?
    """,
                (rs, rowNum) -> new ManagerAddOnDTO(
                        rs.getInt("AddOnId"),
                        rs.getInt("ServiceTypeId"),
                        rs.getString("AddOnName"),
                        rs.getDouble("MonthlyPrice"),
                        rs.getString("Description"),
                        rs.getBoolean("IsActive"),
                        rs.getString("IconKey"),
                        rs.getString("ThemeKey")
                ),
                addOnId);
    }

    public void deleteById(int addOnId) {
        jdbc.update("""
        DELETE FROM AddOns
        WHERE AddOnId = ?
    """, addOnId);
    }

}
