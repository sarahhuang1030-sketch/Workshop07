package org.example.controller;

import org.example.dto.EmployeeDashboardDTO;
import org.example.service.EmployeeDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EmployeeDashboardController {

    private final EmployeeDashboardService employeeDashboardService;

    public EmployeeDashboardController(EmployeeDashboardService employeeDashboardService) {
        this.employeeDashboardService = employeeDashboardService;
    }

    @GetMapping("/api/employee/dashboard")
    public ResponseEntity<EmployeeDashboardDTO> getDashboard(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(employeeDashboardService.getDashboard(username));
    }
}