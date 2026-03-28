package org.example.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class EmployeeSalesDTO {

    private Integer employeeId;
    private String firstName;
    private String lastName;
    private Long salesCount;
    private BigDecimal totalSales;
    private LocalDate lastSaleDate;

    public EmployeeSalesDTO(Integer employeeId,
                            String firstName,
                            String lastName,
                            Long salesCount,
                            BigDecimal totalSales,
                            LocalDate lastSaleDate) {
        this.employeeId = employeeId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.salesCount = salesCount;
        this.totalSales = totalSales;
        this.lastSaleDate = lastSaleDate;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public Long getSalesCount() {
        return salesCount;
    }

    public BigDecimal getTotalSales() {
        return totalSales;
    }

    public LocalDate getLastSaleDate() {
        return lastSaleDate;
    }
}