package org.example.controller;

import org.example.dto.EmployeeSalesDTO;
import org.example.dto.ManagerReportSummaryDTO;
import org.example.model.UserAccount;
import org.example.repository.ManagerReportRepository;
import org.example.repository.SubscriptionRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.sql.Date;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/manager/reports")
public class ManagerReportController {

    private final ManagerReportRepository managerReportRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserAccountRepository userAccountRepository;

    public ManagerReportController(
            ManagerReportRepository managerReportRepository,
            SubscriptionRepository subscriptionRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.managerReportRepository = managerReportRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.userAccountRepository = userAccountRepository;
    }

    // =========================================================
    // 1. Dashboard summary
    // =========================================================
    @GetMapping("/summary")
    public ManagerReportSummaryDTO getSummary() {
        return managerReportRepository.getSummary();
    }

    // =========================================================
    // 2. Get ALL employee sales
    // =========================================================
    @GetMapping("/employee-sales")
    public List<EmployeeSalesDTO> getEmployeeSales() {

        List<Object[]> rows = subscriptionRepository.getEmployeeSalesSummaryRaw();
        List<EmployeeSalesDTO> result = new ArrayList<>();

        for (Object[] row : rows) {

            Integer employeeId = ((Number) row[0]).intValue();
            String firstName = (String) row[1];
            String lastName = (String) row[2];
            Long salesCount = ((Number) row[3]).longValue();

            BigDecimal totalSales =
                    row[4] instanceof BigDecimal
                            ? (BigDecimal) row[4]
                            : BigDecimal.valueOf(((Number) row[4]).doubleValue());

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

    // =========================================================
    // 3. Get MY sales (FIXED)
    // =========================================================
    @GetMapping("/my-sales")
    public EmployeeSalesDTO getMySales(Principal principal) {

        // Ensure user is authenticated
        if (principal == null) {
            throw new RuntimeException("Unauthorized");
        }

        // Load user account by username
        UserAccount ua = userAccountRepository
                .findByUsernameIgnoreCase(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Ensure user is an employee
        if (ua.getEmployeeId() == null) {
            throw new RuntimeException("Not an employee account");
        }

        Integer employeeId = ua.getEmployeeId();

        // Fetch employee sales summary
        List<Object[]> rows = subscriptionRepository.getEmployeeSalesByEmployeeId(employeeId);

        // If no data exists, return safe empty DTO
        if (rows == null || rows.isEmpty()) {
            return new EmployeeSalesDTO(
                    employeeId,
                    "",
                    "",
                    0L,
                    BigDecimal.ZERO,
                    null
            );
        }

        Object[] row = rows.get(0);

        // Map SQL result to DTO safely
        Integer id = ((Number) row[0]).intValue();
        String firstName = (String) row[1];
        String lastName = (String) row[2];
        Long salesCount = ((Number) row[3]).longValue();

        BigDecimal totalSales =
                row[4] instanceof BigDecimal
                        ? (BigDecimal) row[4]
                        : BigDecimal.valueOf(((Number) row[4]).doubleValue());

        LocalDate lastSaleDate = null;
        if (row[5] instanceof Date) {
            lastSaleDate = ((Date) row[5]).toLocalDate();
        }

        // Return final DTO
        return new EmployeeSalesDTO(
                id,
                firstName,
                lastName,
                salesCount,
                totalSales,
                lastSaleDate
        );
    }
}