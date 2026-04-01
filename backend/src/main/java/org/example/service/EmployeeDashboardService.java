package org.example.service;

import org.example.dto.EmployeeDashboardDTO;
import org.example.model.Employee;
import org.example.model.UserAccount;
import org.example.repository.*;
import org.example.repository.AddOnRepository;
import org.springframework.stereotype.Service;

@Service
public class EmployeeDashboardService {

    private final UserAccountRepository userAccountRepository;
    private final EmployeeRepository employeeRepository;
    private final LocationRepository locationRepository;
    private final AddOnRepository addonRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final AuditLogRepository auditLogRepository;
    private final PlanFeatureRepository planFeatureRepository;

    public EmployeeDashboardService(UserAccountRepository userAccountRepository,
                                    EmployeeRepository employeeRepository,
                                    LocationRepository locationRepository,
                                    AddOnRepository addonRepository,
                                    SubscriptionRepository subscriptionRepository,
                                    InvoiceRepository invoiceRepository,
                                    AuditLogRepository auditLogRepository, PlanFeatureRepository planFeatureRepository) {
        this.userAccountRepository = userAccountRepository;
        this.employeeRepository = employeeRepository;
        this.locationRepository = locationRepository;
        this.addonRepository = addonRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.invoiceRepository = invoiceRepository;
        this.auditLogRepository = auditLogRepository;
        this.planFeatureRepository = planFeatureRepository;
    }

    public EmployeeDashboardDTO getDashboard(String username) {
        UserAccount ua = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (ua.getEmployeeId() == null) {
            throw new RuntimeException("This user is not linked to an employee");
        }

        Employee employee = employeeRepository.findById(ua.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        return new EmployeeDashboardDTO(
                employee.getFirstName(),
                (int) locationRepository.countActiveLocations(),
                (int) addonRepository.countActiveAddons(),
                (int) subscriptionRepository.countActiveSubscriptions(),
                (int) invoiceRepository.countPendingInvoices(),
                (int) auditLogRepository.countLogs(),
                (int) planFeatureRepository.count()
        );
    }
}