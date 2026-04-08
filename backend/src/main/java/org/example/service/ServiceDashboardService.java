package org.example.service;

import org.example.dto.ManagerServiceAppointmentDTO;
import org.example.dto.ManagerServiceRequestDTO;
import org.example.dto.ServiceDashboardSummaryDTO;
import org.example.model.ServiceAppointment;
import org.example.model.ServiceRequest;
import org.example.model.UserAccount;
import org.example.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServiceDashboardService {

    private final ServiceDashboardRepository repository;
    private final UserAccountRepository userAccountRepository;
    private final ManagerServiceRequestRepository serviceRequestRepository;
    private final ManagerServiceAppointmentRepository serviceAppointmentRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomerAddressRepository customerAddressRepository;

    public ServiceDashboardService(ServiceDashboardRepository repository,
                                   UserAccountRepository userAccountRepository,
                                   ManagerServiceRequestRepository serviceRequestRepository,
                                   ManagerServiceAppointmentRepository serviceAppointmentRepository,
                                   CustomerRepository customerRepository,
                                   EmployeeRepository employeeRepository,
                                   CustomerAddressRepository customerAddressRepository) {
        this.repository = repository;
        this.userAccountRepository = userAccountRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.serviceAppointmentRepository = serviceAppointmentRepository;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.customerAddressRepository = customerAddressRepository;
    }

    public ServiceDashboardSummaryDTO getSummary(String username) {
        return repository.getSummaryByUsername(username);
    }

    public List<ManagerServiceRequestDTO> getAssignedTickets(String username) {
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return serviceRequestRepository.findByAssignedTechnicianUserId(user.getUserId())
                .stream()
                .map(this::toRequestDTO)
                .toList();
    }

    public List<ManagerServiceAppointmentDTO> getAssignedAppointments(String username) {
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return serviceAppointmentRepository.findByTechnicianUserId(user.getUserId())
                .stream()
                .map(this::toAppointmentDTO)
                .toList();
    }

    public void updateTicketStatus(Integer ticketId, String status) {
        ServiceRequest request = serviceRequestRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        request.setStatus(status);
        serviceRequestRepository.save(request);
    }

    public void updateAppointmentStatus(Integer appointmentId, String status) {
        ServiceAppointment appointment = serviceAppointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus(status);
        serviceAppointmentRepository.save(appointment);
    }

    private ManagerServiceRequestDTO toRequestDTO(ServiceRequest request) {
        ManagerServiceRequestDTO dto = new ManagerServiceRequestDTO();
        dto.setRequestId(request.getRequestId());
        dto.setCustomerId(request.getCustomerId());
        dto.setCreatedByUserId(request.getCreatedByUserId());
        dto.setAssignedTechnicianUserId(request.getAssignedTechnicianUserId());
        dto.setRequestType(request.getRequestType());
        dto.setStatus(request.getStatus());
        dto.setDescription(request.getDescription());
        dto.setPriority(request.getPriority() != null ? request.getPriority().name() : null);
        dto.setCreatedAt(request.getCreatedAt());
        dto.setCustomerName(
                request.getCustomerId() != null
                        ? customerRepository.findById(request.getCustomerId())
                        .map(c -> c.getFirstName() + " " + c.getLastName())
                        .orElse("—")
                        : "—"
        );

        dto.setCreatedByName(
                request.getCreatedByUserId() != null
                        ? employeeRepository.findById(request.getCreatedByUserId())
                        .map(e -> e.getFirstName() + " " + e.getLastName())
                        .orElse("—")
                        : "—"
        );

        dto.setTechnicianName(
                request.getAssignedTechnicianUserId() != null
                        ? employeeRepository.findById(request.getAssignedTechnicianUserId())
                        .map(e -> e.getFirstName() + " " + e.getLastName())
                        .orElse("—")
                        : "—"
        );

        customerAddressRepository.findFirstByCustomerIdOrderByIsPrimaryDesc(request.getCustomerId())
                .ifPresent(address -> {
                    dto.setAddressId(address.getAddressId().intValue());
                    dto.setAddressText(
                            ((address.getStreet1() != null ? address.getStreet1() : "") + " " +
                                    (address.getStreet2() != null ? address.getStreet2() : "") + ", " +
                                    (address.getCity() != null ? address.getCity() : "") + ", " +
                                    (address.getProvince() != null ? address.getProvince() : "") + " " +
                                    (address.getPostalCode() != null ? address.getPostalCode() : ""))
                                    .trim()
                    );
                });

        return dto;
    }

    private ManagerServiceAppointmentDTO toAppointmentDTO(ServiceAppointment appointment) {
        ManagerServiceAppointmentDTO dto = new ManagerServiceAppointmentDTO();

        dto.setAppointmentId(appointment.getAppointmentId());
        dto.setRequestId(appointment.getRequestId());
        dto.setTechnicianUserId(appointment.getTechnicianUserId());
        dto.setAddressId(appointment.getAddressId());
        dto.setLocationId(appointment.getLocationId());
        dto.setLocationType(
                appointment.getLocationType() != null
                        ? appointment.getLocationType().name()
                        : null
        );
        dto.setScheduledStart(appointment.getScheduledStart());
        dto.setScheduledEnd(appointment.getScheduledEnd());
        dto.setStatus(appointment.getStatus());
        dto.setNotes(appointment.getNotes());

        dto.setTechnicianName(
                appointment.getTechnicianUserId() != null
                        ? employeeRepository.findById(appointment.getTechnicianUserId())
                        .map(e -> e.getFirstName() + " " + e.getLastName())
                        .orElse("—")
                        : "—"
        );

        dto.setAddressText(
                appointment.getAddressId() != null
                        ? customerAddressRepository.findById(Long.valueOf(appointment.getAddressId()))
                        .map(a -> {
                            String street1 = a.getStreet1() != null ? a.getStreet1() : "";
                            String street2 = a.getStreet2() != null ? a.getStreet2() : "";
                            String city = a.getCity() != null ? a.getCity() : "";
                            String province = a.getProvince() != null ? a.getProvince() : "";
                            String postalCode = a.getPostalCode() != null ? a.getPostalCode() : "";

                            return (street1 + " " + street2 + ", " + city + ", " + province + " " + postalCode).trim();
                        })
                        .orElse("—")
                        : "—"
        );

        return dto;
    }
}