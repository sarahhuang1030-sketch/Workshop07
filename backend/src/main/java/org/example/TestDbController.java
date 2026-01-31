package org.example;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TestDbController {

    private final JdbcTemplate jdbcTemplate;

    public TestDbController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/db-test")
    public Map<String, Object> dbTest() {
        // Change query to anything you want
        return jdbcTemplate.queryForMap("SELECT COUNT(*) AS plansCount FROM Plans");
    }
}
