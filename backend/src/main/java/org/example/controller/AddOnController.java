package org.example.controller;

import org.example.dto.AddOnDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addons")
public class AddOnController {
    private final JdbcTemplate jdbc;

    public AddOnController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<AddOnDTO> getAllAddOns() {
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
}
