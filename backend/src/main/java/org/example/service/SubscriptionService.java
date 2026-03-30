package org.example.service;

import org.example.dto.CurrentPlanResponseDTO;
import org.example.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    public CurrentPlanResponseDTO getCurrentPlan(Integer customerId) {
        List<Object[]> rows = subscriptionRepository.findActivePlansByCustomerIdRaw(customerId);

        if (rows == null || rows.isEmpty()) {
            return null;
        }

        double totalMonthlyPrice = 0.0;

        for (Object[] row : rows) {
            double monthlyPrice = row[5] != null ? ((Number) row[5]).doubleValue() : 0.0;
            double addonTotal = row[6] != null ? ((Number) row[6]).doubleValue() : 0.0;
            totalMonthlyPrice += monthlyPrice + addonTotal;
        }

        Object[] firstRow = rows.get(0);

        String firstPlanName = (String) firstRow[4];
        String displayPlanName = rows.size() == 1
                ? firstPlanName
                : firstPlanName + " + " + (rows.size() - 1) + " more";

        return new CurrentPlanResponseDTO(
                ((Number) firstRow[0]).intValue(),
                ((Number) firstRow[1]).intValue(),
                ((Number) firstRow[2]).intValue(),
                (String) firstRow[3],
                displayPlanName,
                totalMonthlyPrice
        );
    }
}