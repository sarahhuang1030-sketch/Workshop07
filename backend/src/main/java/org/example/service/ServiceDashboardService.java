package org.example.service;

import org.example.dto.ServiceDashboardSummaryDTO;
import org.example.repository.ServiceDashboardRepository;
import org.springframework.stereotype.Service;

@Service
public class ServiceDashboardService {

    private final ServiceDashboardRepository repository;

    public ServiceDashboardService(ServiceDashboardRepository repository) {
        this.repository = repository;
    }

    public ServiceDashboardSummaryDTO getSummary(String username) {
        return repository.getSummaryByUsername(username);
    }
}