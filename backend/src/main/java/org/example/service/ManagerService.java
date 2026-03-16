//for the dashboard

package org.example.service;

import org.example.dto.ManagerSummaryDTO;
import org.example.repository.ManagerRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ManagerService {

    private final ManagerRepository managerRepository;

    public ManagerService(ManagerRepository managerRepository) {
        this.managerRepository = managerRepository;
    }

    public ManagerSummaryDTO getSummary() {
        long customers = managerRepository.countCustomers();
        long activeSubs = managerRepository.countActiveSubscriptions();
        long pastDueInvoices = managerRepository.countPastDueInvoices();
        long suspendedSubs = managerRepository.countSuspendedSubscriptions();
        BigDecimal monthlyRevenue = managerRepository.calculateMonthlyRevenue();
        long addOns = managerRepository.countAddOns();
        long planFeatures = managerRepository.countPlanFeatures();

        if (monthlyRevenue == null) {
            monthlyRevenue = BigDecimal.ZERO;
        }

        int combinedPastDueAndSuspended = (int) (pastDueInvoices + suspendedSubs);

        return new ManagerSummaryDTO(
                (int) customers,
                (int) activeSubs,
                monthlyRevenue,
                combinedPastDueAndSuspended,
                addOns,
                planFeatures
        );
    }
}