package org.example.controller;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager/plans/{planId}/addons")
public class ManagerPlanAddOnController {

    private final JdbcTemplate jdbc;

    public ManagerPlanAddOnController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<Map<String, Object>> getPlanAddOns(@PathVariable int planId) {
        return jdbc.queryForList("""
            SELECT pa.AddOnId AS addOnId
            FROM PlanAddOns pa
            WHERE pa.PlanId = ?
        """, planId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void addAddOnToPlan(
            @PathVariable int planId,
            @RequestBody Map<String, Integer> body
    ) {
        Integer addOnId = body.get("addOnId");

        jdbc.update("""
            INSERT INTO PlanAddOns (PlanId, AddOnId)
            VALUES (?, ?)
        """, planId, addOnId);
    }

    @DeleteMapping("/{addOnId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAddOnFromPlan(
            @PathVariable int planId,
            @PathVariable int addOnId
    ) {
        jdbc.update("""
            DELETE FROM PlanAddOns
            WHERE PlanId = ? AND AddOnId = ?
        """, planId, addOnId);
    }
}