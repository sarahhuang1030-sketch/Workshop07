package org.example.service;

import org.example.dto.ServiceDashboardSummaryDTO;
import org.example.dto.ServiceTicketDTO;
import org.example.dto.ServiceWorkOrderDTO;
import org.example.model.CustomerAddress;
import org.example.model.Employee;
import org.example.model.ServiceAppointment;
import org.example.model.ServiceRequest;
import org.example.model.UserAccount;
import org.example.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ServiceDashboardService {

    private final ServiceDashboardRepository repository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ServiceAppointmentRepository serviceAppointmentRepository;
    private final UserAccountRepository userAccountRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository customerAddressRepository;

    public ServiceDashboardService(ServiceDashboardRepository repository,
                                   ServiceRequestRepository serviceRequestRepository,
                                   ServiceAppointmentRepository serviceAppointmentRepository,
                                   UserAccountRepository userAccountRepository,
                                   EmployeeRepository employeeRepository,
                                   CustomerRepository customerRepository,
                                   CustomerAddressRepository customerAddressRepository) {
        this.repository = repository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.serviceAppointmentRepository = serviceAppointmentRepository;
        this.userAccountRepository = userAccountRepository;
        this.employeeRepository = employeeRepository;
        this.customerRepository = customerRepository;
        this.customerAddressRepository = customerAddressRepository;
    }

    public ServiceDashboardSummaryDTO getSummary(String username) {
        return repository.getSummaryByUsername(username);
    }

    public List<ServiceTicketDTO> getMyTickets(String username) {
        Integer userId = userAccountRepository.findByUsernameIgnoreCase(username)
                .map(UserAccount::getUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return serviceRequestRepository.findByAssignedTechnicianUserId(userId)
                .stream()
                .sorted(Comparator.comparing(ServiceRequest::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::convertToTicketDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateTicketStatus(Integer requestId, String status) {
        ServiceRequest req = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service Request not found"));

        req.setStatus(normalizeStatus(status));
        serviceRequestRepository.save(req);
    }

    public List<ServiceWorkOrderDTO> getMyWorkOrders(String username) {
        Integer userId = userAccountRepository.findByUsernameIgnoreCase(username)
                .map(UserAccount::getUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return serviceAppointmentRepository.findByTechnicianUserId(userId)
                .stream()
                .sorted(Comparator.comparing(ServiceAppointment::getScheduledStart,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::convertToWorkOrderDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateWorkOrderStatus(Integer appointmentId, String status) {
        ServiceAppointment appt = serviceAppointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Service Appointment not found"));

        String normalizedStatus = normalizeStatus(status);
        appt.setStatus(normalizedStatus);
        serviceAppointmentRepository.save(appt);

        syncRequestStatusFromAppointments(appt.getRequestId(), normalizedStatus);
    }

    private void syncRequestStatusFromAppointments(Integer requestId, String latestAppointmentStatus) {
        ServiceRequest request = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service Request not found"));

        List<ServiceAppointment> appointments = serviceAppointmentRepository.findByRequestId(requestId);

        if (appointments.isEmpty()) {
            request.setStatus(latestAppointmentStatus);
            serviceRequestRepository.save(request);
            return;
        }

        List<String> statuses = appointments.stream()
                .map(ServiceAppointment::getStatus)
                .map(this::normalizeStatus)
                .toList();

        if (statuses.stream().anyMatch(s -> s.equals("In Progress"))) {
            request.setStatus("In Progress");
        } else if (statuses.stream().allMatch(s -> s.equals("Completed") || s.equals("Cancelled"))) {
            if (statuses.stream().allMatch(s -> s.equals("Cancelled"))) {
                request.setStatus("Cancelled");
            } else {
                request.setStatus("Completed");
            }
        } else if (statuses.stream().anyMatch(s -> s.equals("Assigned"))) {
            request.setStatus("Assigned");
        } else if (statuses.stream().anyMatch(s -> s.equals("Open"))) {
            request.setStatus("Open");
        } else {
            request.setStatus(latestAppointmentStatus);
        }

        serviceRequestRepository.save(request);
    }

    private ServiceTicketDTO convertToTicketDTO(ServiceRequest req) {
        ServiceTicketDTO dto = new ServiceTicketDTO();
        dto.setRequestId(req.getRequestId());
        dto.setRequestType(req.getRequestType());
        dto.setStatus(normalizeStatus(req.getStatus()));
        dto.setPriority(req.getPriority() != null ? req.getPriority().name() : null);
        dto.setCreatedAt(req.getCreatedAt());
        dto.setDescription(req.getDescription());

        customerRepository.findById(req.getCustomerId()).ifPresent(c ->
                dto.setCustomerName(c.getFirstName() + " " + c.getLastName())
        );

        List<ServiceWorkOrderDTO> appointments = serviceAppointmentRepository.findByRequestId(req.getRequestId())
                .stream()
                .sorted(Comparator.comparing(ServiceAppointment::getScheduledStart,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::convertToWorkOrderDTO)
                .collect(Collectors.toList());

        dto.setAppointments(appointments);

        return dto;
    }

    private ServiceWorkOrderDTO convertToWorkOrderDTO(ServiceAppointment appt) {
        ServiceWorkOrderDTO dto = new ServiceWorkOrderDTO();
        dto.setAppointmentId(appt.getAppointmentId());
        dto.setRequestId(appt.getRequestId());
        dto.setLocationType(appt.getLocationType() != null ? appt.getLocationType().name() : null);
        dto.setScheduledStart(appt.getScheduledStart());
        dto.setScheduledEnd(appt.getScheduledEnd());
        dto.setStatus(normalizeStatus(appt.getStatus()));
        dto.setNotes(appt.getNotes());

        serviceRequestRepository.findById(appt.getRequestId()).ifPresent(req -> {
            dto.setRequestDescription(req.getDescription());
            dto.setPriority(req.getPriority() != null ? req.getPriority().name() : null);

            customerRepository.findById(req.getCustomerId()).ifPresent(c ->
                    dto.setCustomerName(c.getFirstName() + " " + c.getLastName())
            );
        });

        if (appt.getAddressId() != null) {
            customerAddressRepository.findById(Long.valueOf(appt.getAddressId()))
                    .ifPresent(address -> dto.setAddressText(buildAddressText(address)));
        }

        return dto;
    }

    private String buildAddressText(CustomerAddress address) {
        String street1 = address.getStreet1() != null ? address.getStreet1() : "";
        String street2 = address.getStreet2() != null ? address.getStreet2() : "";
        String city = address.getCity() != null ? address.getCity() : "";
        String province = address.getProvince() != null ? address.getProvince() : "";
        String postalCode = address.getPostalCode() != null ? address.getPostalCode() : "";

        return (street1 + " " + street2 + ", " + city + ", " + province + " " + postalCode)
                .trim()
                .replaceAll(" +", " ");
    }

    private String normalizeStatus(String rawStatus) {
        if (rawStatus == null) {
            return "Open";
        }

        String cleaned = rawStatus.replace("\"", "").trim();
        String key = cleaned.toLowerCase(Locale.ROOT).replace("_", " ");

        return switch (key) {
            case "open" -> "Open";
            case "assigned" -> "Assigned";
            case "in progress" -> "In Progress";
            case "completed" -> "Completed";
            case "cancelled", "canceled" -> "Cancelled";
            default -> cleaned;
        };
    }

    private String resolveEmployeeNameFromUserId(Integer userId) {
        if (userId == null) {
            return null;
        }

        Optional<UserAccount> userOpt = userAccountRepository.findById(userId);
        if (userOpt.isEmpty() || userOpt.get().getEmployeeId() == null) {
            return null;
        }

        Optional<Employee> employeeOpt = employeeRepository.findById(userOpt.get().getEmployeeId());
        if (employeeOpt.isEmpty()) {
            return null;
        }

        Employee employee = employeeOpt.get();
        return (employee.getFirstName() + " " + employee.getLastName()).trim();
    }
}