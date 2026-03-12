package org.example.controller;

import org.example.dto.ManagerReportSummaryDTO;
import org.example.repository.ManagerReportRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/reports")
public class ManagerReportController {

    private final ManagerReportRepository managerReportRepository;

    public ManagerReportController(ManagerReportRepository managerReportRepository) {
        this.managerReportRepository = managerReportRepository;
    }

    @GetMapping("/summary")
    public ManagerReportSummaryDTO getSummary() {
        return managerReportRepository.getSummary();
    }
}
