package org.example.service;

import org.example.dto.EmployeeSalesDetailDTO;
import org.example.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class EmployeeSalesService {

    private final SubscriptionRepository repo;

    public EmployeeSalesService(SubscriptionRepository repo) {
        this.repo = repo;
    }

    public List<EmployeeSalesDetailDTO> getEmployeeSalesDetails(Integer employeeId) {

        List<Object[]> rows = repo.getEmployeeSalesDetails(employeeId);

        return rows.stream().map(r -> new EmployeeSalesDetailDTO(

                ((Number) r[0]).intValue(),   // subscriptionId
                ((Number) r[1]).intValue(),   // customerId
                (String) r[2],                // customerName
                ((Number) r[3]).intValue(),   // planId
                (String) r[4],                // status
                (String) r[5],                // planName

                r[6] instanceof BigDecimal
                        ? (BigDecimal) r[6]
                        : BigDecimal.valueOf(((Number) r[6]).doubleValue()),

                r[7] instanceof BigDecimal
                        ? (BigDecimal) r[7]
                        : BigDecimal.valueOf(((Number) r[7]).doubleValue()),

                r[8] != null
                        ? ((java.sql.Date) r[8]).toLocalDate()
                        : null

        )).toList();
    }
}