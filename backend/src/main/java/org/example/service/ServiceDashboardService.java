package org.example.service;

import org.example.dto.ServiceDashboardSummaryDTO;
import org.example.dto.ServiceTicketDTO;
import org.example.dto.ServiceWorkOrderDTO;
import org.example.model.ServiceAppointment;
import org.example.model.ServiceRequest;
import org.example.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServiceDashboardService {

    private final ServiceDashboardRepository repository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ServiceAppointmentRepository serviceAppointmentRepository;
    private final UserAccountRepository userAccountRepository;
    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository customerAddressRepository;

    public ServiceDashboardService(ServiceDashboardRepository repository,
                                   ServiceRequestRepository serviceRequestRepository,
                                   ServiceAppointmentRepository serviceAppointmentRepository,
                                   UserAccountRepository userAccountRepository,
                                   CustomerRepository customerRepository,
                                   CustomerAddressRepository customerAddressRepository) {
        this.repository = repository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.serviceAppointmentRepository = serviceAppointmentRepository;
        this.userAccountRepository = userAccountRepository;
        this.customerRepository = customerRepository;
        this.customerAddressRepository = customerAddressRepository;
    }

    public ServiceDashboardSummaryDTO getSummary(String username) {
        return repository.getSummaryByUsername(username);
    }

    public List<ServiceTicketDTO> getMyTickets(String username) {
        Integer userId = userAccountRepository.findByUsernameIgnoreCase(username)
                .map(ua -> ua.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return serviceRequestRepository.findByAssignedTechnicianUserId(userId)
                .stream()
                .map(this::convertToTicketDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateTicketStatus(Integer requestId, String status) {
        ServiceRequest req = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service Request not found"));
        req.setStatus(status.replace("\"", "")); // remove quotes if sent as plain string
        serviceRequestRepository.save(req);
    }

    public List<ServiceWorkOrderDTO> getMyWorkOrders(String username) {
        Integer userId = userAccountRepository.findByUsernameIgnoreCase(username)
                .map(ua -> ua.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return serviceAppointmentRepository.findByTechnicianUserId(userId)
                .stream()
                .map(this::convertToWorkOrderDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateWorkOrderStatus(Integer appointmentId, String status) {
        ServiceAppointment appt = serviceAppointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Service Appointment not found"));
        appt.setStatus(status.replace("\"", ""));
        serviceAppointmentRepository.save(appt);
    }

    private ServiceTicketDTO convertToTicketDTO(ServiceRequest req) {
        ServiceTicketDTO dto = new ServiceTicketDTO();
        dto.setRequestId(req.getRequestId());
        dto.setRequestType(req.getRequestType());
        dto.setStatus(req.getStatus());
        dto.setPriority(req.getPriority() != null ? req.getPriority().name() : null);
        dto.setCreatedAt(req.getCreatedAt());
        dto.setDescription(req.getDescription());

        customerRepository.findById(req.getCustomerId()).ifPresent(c -> {
            dto.setCustomerName(c.getFirstName() + " " + c.getLastName());
        });

        return dto;
    }

    private ServiceWorkOrderDTO convertToWorkOrderDTO(ServiceAppointment appt) {
        ServiceWorkOrderDTO dto = new ServiceWorkOrderDTO();
        dto.setAppointmentId(appt.getAppointmentId());
        dto.setRequestId(appt.getRequestId());
        dto.setLocationType(appt.getLocationType() != null ? appt.getLocationType().name() : null);
        dto.setScheduledStart(appt.getScheduledStart());
        dto.setScheduledEnd(appt.getScheduledEnd());
        dto.setStatus(appt.getStatus());
        dto.setNotes(appt.getNotes());

        serviceRequestRepository.findById(appt.getRequestId()).ifPresent(req -> {
            customerRepository.findById(req.getCustomerId()).ifPresent(c -> {
                dto.setCustomerName(c.getFirstName() + " " + c.getLastName());
            });
        });

        if (appt.getAddressId() != null) {
            customerAddressRepository.findById(Long.valueOf(appt.getAddressId())).ifPresent(a -> {
                dto.setAddressText((a.getStreet1() + " " + (a.getStreet2() != null ? a.getStreet2() : "") + ", " + a.getCity()).trim());
            });
        }

        return dto;
    }
}