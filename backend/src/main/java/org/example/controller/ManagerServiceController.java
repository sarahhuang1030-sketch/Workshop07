package org.example.controller;

import org.example.dto.CustomerAddressDTO;
import org.example.dto.ManagerServiceAppointmentDTO;
import org.example.dto.ManagerServiceRequestDTO;
import org.example.model.CustomerAddress;
import org.example.model.ServiceAppointment;
import org.example.model.ServiceRequest;
import org.example.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/manager/service-requests")
@PreAuthorize("hasRole('MANAGER')")
public class ManagerServiceController {

    private final ManagerServiceRequestRepository serviceRequestRepository;
    private final ManagerServiceAppointmentRepository serviceAppointmentRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomerAddressRepository customerAddressRepository;

    public ManagerServiceController(
            ManagerServiceRequestRepository serviceRequestRepository,
            ManagerServiceAppointmentRepository serviceAppointmentRepository,
            CustomerRepository customerRepository,
            EmployeeRepository employeeRepository,
            CustomerAddressRepository customerAddressRepository
    ) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.serviceAppointmentRepository = serviceAppointmentRepository;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.customerAddressRepository = customerAddressRepository;
    }

    @GetMapping
    public List<ManagerServiceRequestDTO> getAllServiceRequests() {
        return serviceRequestRepository.findAll()
                .stream()
                .map(this::toRequestDTO)
                .toList();
    }



    // ✅ GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ServiceRequest> getById(@PathVariable Integer id) {
        return serviceRequestRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ CREATE
    @PostMapping
    public ServiceRequest create(@RequestBody ServiceRequest request) {

        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        return serviceRequestRepository.save(request);
    }

    // ✅ UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<ServiceRequest> update(
            @PathVariable Integer id,
            @RequestBody ServiceRequest updated
    ) {
        return serviceRequestRepository.findById(id)
                .map(existing -> {

                    existing.setCustomerId(updated.getCustomerId());
                    existing.setCreatedByUserId(updated.getCreatedByUserId());
                    existing.setAssignedTechnicianUserId(updated.getAssignedTechnicianUserId());
                    existing.setParentRequestId(updated.getParentRequestId());
                    existing.setRequestType(updated.getRequestType());
                    existing.setPriority(updated.getPriority());
                    existing.setStatus(updated.getStatus());
                    existing.setDescription(updated.getDescription());
                    existing.setUpdatedAt(LocalDateTime.now());

                    return ResponseEntity.ok(serviceRequestRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {

        if (!serviceRequestRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        serviceRequestRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
// service appointment endpoints
private ServiceAppointment.ServiceLocationType parseLocationType(String value) {
    if (value == null || value.isBlank()) {
        return null;
    }

    for (ServiceAppointment.ServiceLocationType type : ServiceAppointment.ServiceLocationType.values()) {
        if (type.name().equalsIgnoreCase(value.trim())) {
            return type;
        }
    }

    throw new IllegalArgumentException("Invalid locationType: " + value);
}

    @GetMapping("/{requestId}/appointments")
    public List<ManagerServiceAppointmentDTO> getAppointmentsByRequestId(@PathVariable Integer requestId) {
        return serviceAppointmentRepository.findByRequestId(requestId)
                .stream()
                .map(this::toAppointmentDTO)
                .toList();
    }

    @PostMapping("/{requestId}/appointments")
    public ResponseEntity<ManagerServiceAppointmentDTO> createAppointment(
            @PathVariable Integer requestId,
            @RequestBody ManagerServiceAppointmentDTO dto
    ) {
        try {
            ServiceAppointment appointment = new ServiceAppointment();

            appointment.setRequestId(requestId);
            appointment.setTechnicianUserId(dto.getTechnicianUserId());
            appointment.setAddressId(dto.getAddressId());
            appointment.setLocationId(dto.getLocationId());
            appointment.setLocationType(parseLocationType(dto.getLocationType()));
            appointment.setScheduledStart(dto.getScheduledStart());
            appointment.setScheduledEnd(dto.getScheduledEnd());
            appointment.setStatus(dto.getStatus());
            appointment.setNotes(dto.getNotes());

            ServiceAppointment saved = serviceAppointmentRepository.save(appointment);
            return ResponseEntity.ok(toAppointmentDTO(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{requestId}/appointments/{appointmentId}")
    public ResponseEntity<ManagerServiceAppointmentDTO> updateAppointment(
            @PathVariable Integer requestId,
            @PathVariable Integer appointmentId,
            @RequestBody ManagerServiceAppointmentDTO dto
    ) {
        ServiceAppointment existing = serviceAppointmentRepository.findById(appointmentId)
                .orElse(null);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (!existing.getRequestId().equals(requestId)) {
            return ResponseEntity.notFound().build();
        }

        try {
            existing.setTechnicianUserId(dto.getTechnicianUserId());
            existing.setAddressId(dto.getAddressId());
            existing.setLocationId(dto.getLocationId());
            existing.setLocationType(parseLocationType(dto.getLocationType()));
            existing.setScheduledStart(dto.getScheduledStart());
            existing.setScheduledEnd(dto.getScheduledEnd());
            existing.setStatus(dto.getStatus());
            existing.setNotes(dto.getNotes());

            ServiceAppointment saved = serviceAppointmentRepository.save(existing);
            return ResponseEntity.ok(toAppointmentDTO(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{requestId}/appointments/{appointmentId}")
    public ResponseEntity<Void> deleteAppointment(
            @PathVariable Integer requestId,
            @PathVariable Integer appointmentId
    ) {
        ServiceAppointment existing = serviceAppointmentRepository.findById(appointmentId)
                .orElse(null);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (!existing.getRequestId().equals(requestId)) {
            return ResponseEntity.notFound().build();
        }

        serviceAppointmentRepository.delete(existing);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/customers/{customerId}/addresses")
    public List<CustomerAddressDTO> getCustomerAddresses(@PathVariable Integer customerId) {
        return customerAddressRepository.findByCustomerId(customerId)
                .stream()
                .map(this::toAddressDTO)
                .toList();
    }

    private CustomerAddressDTO toAddressDTO(CustomerAddress address) {
        CustomerAddressDTO dto = new CustomerAddressDTO();
        dto.setAddressId(address.getAddressId());
        dto.setCustomerId(address.getCustomerId());
        dto.setAddressType(address.getAddressType());
        dto.setStreet1(address.getStreet1());
        dto.setStreet2(address.getStreet2());
        dto.setCity(address.getCity());
        dto.setProvince(address.getProvince());
        dto.setPostalCode(address.getPostalCode());
        dto.setCountry(address.getCountry());
        dto.setIsPrimary(address.getIsPrimary());

        String s1 = address.getStreet1() != null ? address.getStreet1() : "";
        String s2 = address.getStreet2() != null ? address.getStreet2() : "";
        String city = address.getCity() != null ? address.getCity() : "";
        String prov = address.getProvince() != null ? address.getProvince() : "";
        String pc = address.getPostalCode() != null ? address.getPostalCode() : "";

        dto.setFullAddress((s1 + " " + s2 + ", " + city + ", " + prov + " " + pc).trim().replaceAll("  +", " "));
        return dto;
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