package org.example.service;

import org.example.dto.CustomerServiceAppointmentDTO;
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
    private final EmployeeRepository employeeRepository;

    public ServiceDashboardService(ServiceDashboardRepository repository,
                                   ServiceRequestRepository serviceRequestRepository,
                                   ServiceAppointmentRepository serviceAppointmentRepository,
                                   UserAccountRepository userAccountRepository,
                                   CustomerRepository customerRepository,
                                   CustomerAddressRepository customerAddressRepository,
                                   EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.serviceAppointmentRepository = serviceAppointmentRepository;
        this.userAccountRepository = userAccountRepository;
        this.customerRepository = customerRepository;
        this.customerAddressRepository = customerAddressRepository;
        this.employeeRepository = employeeRepository;
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
        String cleanStatus = status.replace("\"", "");
        req.setStatus(cleanStatus);
        serviceRequestRepository.save(req);

        // If ticket is completed, mark all appointments as completed if they aren't already
        if ("Completed".equalsIgnoreCase(cleanStatus)) {
            List<ServiceAppointment> appts = serviceAppointmentRepository.findByRequestId(requestId);
            for (ServiceAppointment appt : appts) {
                if (!"Completed".equalsIgnoreCase(appt.getStatus()) && !"Cancelled".equalsIgnoreCase(appt.getStatus())) {
                    appt.setStatus("Completed");
                    serviceAppointmentRepository.save(appt);
                }
            }
        }
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
        String cleanStatus = status.replace("\"", "");
        appt.setStatus(cleanStatus);
        serviceAppointmentRepository.save(appt);

        ServiceRequest req = serviceRequestRepository.findById(appt.getRequestId()).orElse(null);
        if (req != null) {
            if ("In Progress".equalsIgnoreCase(cleanStatus)) {
                req.setStatus("In Progress");
                serviceRequestRepository.save(req);
            } else if ("Completed".equalsIgnoreCase(cleanStatus)) {
                // Check if all appointments for this request are completed or cancelled
                List<ServiceAppointment> allAppts = serviceAppointmentRepository.findByRequestId(req.getRequestId());
                boolean allDone = allAppts.stream().allMatch(a ->
                    "Completed".equalsIgnoreCase(a.getStatus()) || "Cancelled".equalsIgnoreCase(a.getStatus())
                );
                if (allDone) {
                    req.setStatus("Completed");
                    serviceRequestRepository.save(req);
                }
            }
        }
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

        customerAddressRepository.findByCustomerIdAndAddressType(req.getCustomerId(), "Service")
                .or(() -> customerAddressRepository.findFirstByCustomerIdAndAddressTypeOrderByIsPrimaryDesc(req.getCustomerId(), "Billing"))
                .or(() -> customerAddressRepository.findFirstByCustomerIdOrderByIsPrimaryDesc(req.getCustomerId()))
                .ifPresent(a -> {
                    dto.setAddressText((a.getStreet1() + " " + (a.getStreet2() != null ? a.getStreet2() : "") + ", " + a.getCity()).trim());
                });

        List<CustomerServiceAppointmentDTO> appointments = serviceAppointmentRepository.findByRequestId(req.getRequestId())
                .stream()
                .map(this::convertToCustomerAppointmentDTO)
                .collect(Collectors.toList());
        dto.setAppointments(appointments);

        return dto;
    }

    private CustomerServiceAppointmentDTO convertToCustomerAppointmentDTO(ServiceAppointment appt) {
        CustomerServiceAppointmentDTO dto = new CustomerServiceAppointmentDTO();
        dto.setAppointmentId(appt.getAppointmentId());
        dto.setLocationType(appt.getLocationType() != null ? appt.getLocationType().name() : null);
        dto.setScheduledStart(appt.getScheduledStart());
        dto.setScheduledEnd(appt.getScheduledEnd());
        dto.setStatus(appt.getStatus());

        if (appt.getTechnicianUserId() != null) {
            userAccountRepository.findById(appt.getTechnicianUserId()).ifPresent(ua -> {
                if (ua.getEmployeeId() != null) {
                    employeeRepository.findById(ua.getEmployeeId()).ifPresent(emp -> {
                        dto.setTechnicianName(emp.getFirstName() + " " + emp.getLastName());
                    });
                }
            });
        }
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
            dto.setRequestDescription(req.getDescription());
            dto.setPriority(req.getPriority() != null ? req.getPriority().name() : null);
            customerRepository.findById(req.getCustomerId()).ifPresent(c -> {
                dto.setCustomerName(c.getFirstName() + " " + c.getLastName());
            });
        });

        if (appt.getAddressId() != null) {
            customerAddressRepository.findById(Long.valueOf(appt.getAddressId())).ifPresent(a -> {
                dto.setAddressText((a.getStreet1() + " " + (a.getStreet2() != null ? a.getStreet2() : "") + ", " + a.getCity() + ", " + a.getProvince()).trim());
            });
        }

        return dto;
    }
}