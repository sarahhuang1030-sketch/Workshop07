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
        long customers           = managerRepository.countCustomers();
        long activeSubs          = managerRepository.countActiveSubscriptions();
        long pastDueInvoices     = managerRepository.countPastDueInvoices();
        BigDecimal monthlyRevenue = managerRepository.calculateMonthlyRevenue();
        long addOns              = managerRepository.countAddOns();
        long planFeatures        = managerRepository.countPlanFeatures();
        long location            = managerRepository.countActiveLocations();
        long serviceRequests     = managerRepository.countServiceRequests();
        long serviceAppointments = managerRepository.countServiceAppointments();
        long totalEmployees      = managerRepository.countEmployees();

        if (monthlyRevenue == null) {
            monthlyRevenue = BigDecimal.ZERO;
        }

        System.out.println("pastDueInvoices = " + pastDueInvoices);
        System.out.println("totalEmployees  = " + totalEmployees);

        return new ManagerSummaryDTO(
                (int) customers,
                (int) activeSubs,
                monthlyRevenue,
                (int) pastDueInvoices,
                addOns,
                planFeatures,
                location,
                serviceRequests,
                serviceAppointments,
                totalEmployees
        );
    }
}