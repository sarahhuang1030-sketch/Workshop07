package org.example.controller;

import org.example.dto.EmployeeSalesDTO;
import org.example.dto.ManagerReportSummaryDTO;
import org.example.repository.ManagerReportRepository;
import org.example.repository.SubscriptionRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.sql.Date;
import java.util.List;

@RestController
@RequestMapping("/api/manager/reports")
public class ManagerReportController {

    private final ManagerReportRepository managerReportRepository;
    private final SubscriptionRepository subscriptionRepository;

    public ManagerReportController(ManagerReportRepository managerReportRepository,
                                   SubscriptionRepository subscriptionRepository) {
        this.managerReportRepository = managerReportRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @GetMapping("/summary")
    public ManagerReportSummaryDTO getSummary() {
        return managerReportRepository.getSummary();
    }

    @GetMapping("/employee-sales")
    public List<EmployeeSalesDTO> getEmployeeSales() {
        List<Object[]> rows = subscriptionRepository.getEmployeeSalesSummaryRaw();
        List<EmployeeSalesDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            Integer employeeId = ((Number) row[0]).intValue();
            String firstName = (String) row[1];
            String lastName = (String) row[2];
            Long salesCount = ((Number) row[3]).longValue();

            BigDecimal totalSales;
            if (row[4] instanceof BigDecimal) {
                totalSales = (BigDecimal) row[4];
            } else {
                totalSales = BigDecimal.valueOf(((Number) row[4]).doubleValue());
            }

            LocalDate lastSaleDate = null;
            if (row[5] instanceof Date) {
                lastSaleDate = ((Date) row[5]).toLocalDate();
            }

            result.add(new EmployeeSalesDTO(
                    employeeId,
                    firstName,
                    lastName,
                    salesCount,
                    totalSales,
                    lastSaleDate
            ));
        }

        return result;
    }



}
