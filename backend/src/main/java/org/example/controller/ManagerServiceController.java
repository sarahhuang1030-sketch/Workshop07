package org.example.controller;

import org.example.dto.CustomerAddressDTO;
import org.example.dto.ManagerServiceAppointmentDTO;
import org.example.dto.ManagerServiceRequestDTO;
import org.example.model.CustomerAddress;
import org.example.model.Employee;
import org.example.model.ServiceAppointment;
import org.example.model.ServiceRequest;
import org.example.model.UserAccount;
import org.example.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/manager/service-requests")
public class ManagerServiceController {

    private final ManagerServiceRequestRepository requestRepository;
    private final ManagerServiceAppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository addressRepository;
    private final UserAccountRepository userAccountRepository;
    private final EmployeeRepository employeeRepository;

    public ManagerServiceController(
            ManagerServiceRequestRepository requestRepository,
            ManagerServiceAppointmentRepository appointmentRepository,
            CustomerRepository customerRepository,
            CustomerAddressRepository addressRepository,
            UserAccountRepository userAccountRepository,
            EmployeeRepository employeeRepository
    ) {
        this.requestRepository = requestRepository;
        this.appointmentRepository = appointmentRepository;
        this.customerRepository = customerRepository;
        this.addressRepository = addressRepository;
        this.userAccountRepository = userAccountRepository;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping
    public List<ManagerServiceRequestDTO> getAllRequests() {
        return requestRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(ServiceRequest::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toRequestDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ManagerServiceRequestDTO> getRequestById(@PathVariable Integer id) {
        return requestRepository.findById(id)
                .map(request -> ResponseEntity.ok(toRequestDTO(request)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody ManagerServiceRequestDTO dto) {
        if (dto.getCustomerId() == null) return bad("CustomerId is required");
        if (dto.getCreatedByUserId() == null) return bad("CreatedByUserId is required");
        if (dto.getRequestType() == null || dto.getRequestType().isBlank()) return bad("RequestType is required");
        if (dto.getStatus() == null || dto.getStatus().isBlank()) return bad("Status is required");

        ServiceRequest req = new ServiceRequest();
        req.setCustomerId(dto.getCustomerId());
        req.setCreatedByUserId(dto.getCreatedByUserId());
        req.setAssignedTechnicianUserId(dto.getAssignedTechnicianUserId());
        req.setRequestType(dto.getRequestType());
        req.setPriority(parsePriority(dto.getPriority()));
        req.setStatus(normalizeStatus(dto.getStatus()));
        req.setDescription(dto.getDescription());
        req.setCreatedAt(LocalDateTime.now());
        req.setUpdatedAt(LocalDateTime.now());

        ServiceRequest saved = requestRepository.save(req);
        return ResponseEntity.ok(toRequestDTO(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRequest(@PathVariable Integer id,
                                           @RequestBody ManagerServiceRequestDTO dto) {
        ServiceRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found"));

        if (dto.getCustomerId() != null) req.setCustomerId(dto.getCustomerId());
        if (dto.getCreatedByUserId() != null) req.setCreatedByUserId(dto.getCreatedByUserId());
        req.setAssignedTechnicianUserId(dto.getAssignedTechnicianUserId());
        if (dto.getRequestType() != null && !dto.getRequestType().isBlank()) req.setRequestType(dto.getRequestType());
        if (dto.getPriority() != null) req.setPriority(parsePriority(dto.getPriority()));
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) req.setStatus(normalizeStatus(dto.getStatus()));
        req.setDescription(dto.getDescription());
        req.setUpdatedAt(LocalDateTime.now());

        ServiceRequest saved = requestRepository.save(req);
        return ResponseEntity.ok(toRequestDTO(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable Integer id) {
        if (!requestRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        appointmentRepository.findByRequestId(id)
                .forEach(a -> appointmentRepository.deleteById(a.getAppointmentId()));

        requestRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{requestId}/appointments")
    public ResponseEntity<List<ManagerServiceAppointmentDTO>> getAppointments(@PathVariable Integer requestId) {
        if (!requestRepository.existsById(requestId)) {
            return ResponseEntity.notFound().build();
        }

        List<ManagerServiceAppointmentDTO> data = appointmentRepository.findByRequestId(requestId)
                .stream()
                .sorted(Comparator.comparing(ServiceAppointment::getScheduledStart,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toAppointmentDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(data);
    }

    @PostMapping("/{requestId}/appointments")
    public ResponseEntity<?> createAppointment(@PathVariable Integer requestId,
                                               @RequestBody ManagerServiceAppointmentDTO dto) {
        if (dto.getTechnicianUserId() == null) return bad("TechnicianUserId is required");
        if (dto.getAddressId() == null) return bad("AddressId is required");
        if (dto.getScheduledStart() == null) return bad("ScheduledStart is required");
        if (dto.getScheduledEnd() == null) return bad("ScheduledEnd is required");
        if (dto.getLocationType() == null || dto.getLocationType().isBlank()) return bad("LocationType is required");

        if (dto.getScheduledEnd().isBefore(dto.getScheduledStart()) || dto.getScheduledEnd().isEqual(dto.getScheduledStart())) {
            return bad("ScheduledEnd must be after ScheduledStart");
        }

        if (!requestRepository.existsById(requestId)) {
            return bad("ServiceRequest not found");
        }

        ServiceAppointment appt = new ServiceAppointment();
        appt.setRequestId(requestId);
        appt.setTechnicianUserId(dto.getTechnicianUserId());
        appt.setAddressId(dto.getAddressId());
        appt.setLocationId(dto.getLocationId());
        appt.setLocationType(parseLocationType(dto.getLocationType()));
        appt.setScheduledStart(dto.getScheduledStart());
        appt.setScheduledEnd(dto.getScheduledEnd());
        appt.setStatus(normalizeStatus(dto.getStatus()));
        appt.setNotes(dto.getNotes());

        ServiceAppointment saved = appointmentRepository.save(appt);

        ServiceRequest req = requestRepository.findById(requestId).get();
        req.setAssignedTechnicianUserId(dto.getTechnicianUserId());
        req.setStatus("Assigned");
        req.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(req);

        return ResponseEntity.ok(toAppointmentDTO(saved));
    }

    @PutMapping("/{requestId}/appointments/{id}")
    public ResponseEntity<?> updateAppointment(@PathVariable Integer requestId,
                                               @PathVariable Integer id,
                                               @RequestBody ManagerServiceAppointmentDTO dto) {
        ServiceAppointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appt.getRequestId().equals(requestId)) {
            return ResponseEntity.notFound().build();
        }

        if (dto.getTechnicianUserId() != null) appt.setTechnicianUserId(dto.getTechnicianUserId());
        if (dto.getAddressId() != null) appt.setAddressId(dto.getAddressId());
        if (dto.getLocationId() != null) appt.setLocationId(dto.getLocationId());
        if (dto.getLocationType() != null && !dto.getLocationType().isBlank()) {
            appt.setLocationType(parseLocationType(dto.getLocationType()));
        }
        if (dto.getScheduledStart() != null) appt.setScheduledStart(dto.getScheduledStart());
        if (dto.getScheduledEnd() != null) appt.setScheduledEnd(dto.getScheduledEnd());
        if (dto.getScheduledStart() != null && dto.getScheduledEnd() != null) {
            if (dto.getScheduledEnd().isBefore(dto.getScheduledStart()) || dto.getScheduledEnd().isEqual(dto.getScheduledStart())) {
                return bad("ScheduledEnd must be after ScheduledStart");
            }
        }
        if (dto.getStatus() != null) appt.setStatus(normalizeStatus(dto.getStatus()));
        if (dto.getNotes() != null) appt.setNotes(dto.getNotes());

        ServiceAppointment saved = appointmentRepository.save(appt);

        ServiceRequest req = requestRepository.findById(requestId).orElse(null);
        if (req != null && saved.getTechnicianUserId() != null) {
            req.setAssignedTechnicianUserId(saved.getTechnicianUserId());
            req.setUpdatedAt(LocalDateTime.now());
            requestRepository.save(req);
        }

        return ResponseEntity.ok(toAppointmentDTO(saved));
    }

    @DeleteMapping("/{requestId}/appointments/{id}")
    public ResponseEntity<?> deleteAppointment(@PathVariable Integer requestId,
                                               @PathVariable Integer id) {
        ServiceAppointment appt = appointmentRepository.findById(id)
                .orElse(null);

        if (appt == null || !appt.getRequestId().equals(requestId)) {
            return ResponseEntity.notFound().build();
        }

        appointmentRepository.delete(appt);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/customers/{customerId}/addresses")
    public ResponseEntity<List<CustomerAddressDTO>> getCustomerAddresses(@PathVariable Integer customerId) {
        List<CustomerAddressDTO> data = addressRepository.findByCustomerId(customerId)
                .stream()
                .map(this::toAddressDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(data);
    }

    private ManagerServiceRequestDTO toRequestDTO(ServiceRequest req) {
        ManagerServiceRequestDTO dto = new ManagerServiceRequestDTO();

        dto.setRequestId(req.getRequestId());
        dto.setCustomerId(req.getCustomerId());
        dto.setCreatedByUserId(req.getCreatedByUserId());
        dto.setAssignedTechnicianUserId(req.getAssignedTechnicianUserId());
        dto.setRequestType(req.getRequestType());
        dto.setStatus(normalizeStatus(req.getStatus()));
        dto.setDescription(req.getDescription());
        dto.setCreatedAt(req.getCreatedAt());
        dto.setPriority(req.getPriority() != null ? req.getPriority().name() : null);

        customerRepository.findById(req.getCustomerId()).ifPresent(c ->
                dto.setCustomerName(c.getFirstName() + " " + c.getLastName())
        );

        dto.setCreatedByName(resolveEmployeeNameFromUserId(req.getCreatedByUserId()));
        dto.setTechnicianName(resolveEmployeeNameFromUserId(req.getAssignedTechnicianUserId()));

        List<CustomerAddress> addresses = addressRepository.findByCustomerId(req.getCustomerId());
        if (!addresses.isEmpty()) {
            CustomerAddress a = addresses.get(0);
            dto.setAddressId(a.getAddressId().intValue());
            dto.setAddressText(buildAddressText(a));
        }

        return dto;
    }

    private ManagerServiceAppointmentDTO toAppointmentDTO(ServiceAppointment appt) {
        ManagerServiceAppointmentDTO dto = new ManagerServiceAppointmentDTO();

        dto.setAppointmentId(appt.getAppointmentId());
        dto.setRequestId(appt.getRequestId());
        dto.setTechnicianUserId(appt.getTechnicianUserId());
        dto.setAddressId(appt.getAddressId());
        dto.setLocationId(appt.getLocationId());
        dto.setLocationType(appt.getLocationType() != null ? appt.getLocationType().name() : null);
        dto.setScheduledStart(appt.getScheduledStart());
        dto.setScheduledEnd(appt.getScheduledEnd());
        dto.setStatus(normalizeStatus(appt.getStatus()));
        dto.setNotes(appt.getNotes());
        dto.setTechnicianName(resolveEmployeeNameFromUserId(appt.getTechnicianUserId()));

        if (appt.getAddressId() != null) {
            addressRepository.findById(Long.valueOf(appt.getAddressId()))
                    .ifPresent(a -> dto.setAddressText(buildAddressText(a)));
        }

        return dto;
    }

    private CustomerAddressDTO toAddressDTO(CustomerAddress a) {
        CustomerAddressDTO dto = new CustomerAddressDTO();
        dto.setAddressId(a.getAddressId());
        dto.setCustomerId(a.getCustomerId());
        dto.setAddressType(a.getAddressType());
        dto.setStreet1(a.getStreet1());
        dto.setStreet2(a.getStreet2());
        dto.setCity(a.getCity());
        dto.setProvince(a.getProvince());
        dto.setPostalCode(a.getPostalCode());
        dto.setCountry(a.getCountry());
        dto.setIsPrimary(a.getIsPrimary());
        dto.setFullAddress(buildFullAddress(a));
        return dto;
    }

    private String resolveEmployeeNameFromUserId(Integer userId) {
        if (userId == null) return null;

        Optional<UserAccount> user = userAccountRepository.findById(userId);
        if (user.isEmpty() || user.get().getEmployeeId() == null) return null;

        Optional<Employee> emp = employeeRepository.findById(user.get().getEmployeeId());
        if (emp.isEmpty()) return null;

        return (emp.get().getFirstName() + " " + emp.get().getLastName()).trim();
    }

    private ServiceRequest.Priority parsePriority(String raw) {
        if (raw == null || raw.isBlank()) return ServiceRequest.Priority.Medium;

        String s = raw.trim().toLowerCase(Locale.ROOT);
        return switch (s) {
            case "low" -> ServiceRequest.Priority.Low;
            case "high" -> ServiceRequest.Priority.High;
            default -> ServiceRequest.Priority.Medium;
        };
    }

    private ServiceAppointment.ServiceLocationType parseLocationType(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("LocationType is required");
        }

        for (ServiceAppointment.ServiceLocationType type : ServiceAppointment.ServiceLocationType.values()) {
            if (type.name().equalsIgnoreCase(raw.trim())) {
                return type;
            }
        }

        throw new IllegalArgumentException("Invalid locationType: " + raw);
    }

    private String normalizeStatus(String raw) {
        if (raw == null || raw.isBlank()) return "Assigned";

        String s = raw.trim().toLowerCase(Locale.ROOT).replace("_", " ");

        return switch (s) {
            case "open" -> "Open";
            case "assigned" -> "Assigned";
            case "in progress" -> "In Progress";
            case "completed" -> "Completed";
            case "cancelled", "canceled" -> "Cancelled";
            default -> raw;
        };
    }

    private String buildAddressText(CustomerAddress a) {
        String street1 = a.getStreet1() != null ? a.getStreet1() : "";
        String street2 = a.getStreet2() != null ? a.getStreet2() : "";
        String city = a.getCity() != null ? a.getCity() : "";

        return (street1 + " " + street2 + ", " + city)
                .trim()
                .replaceAll(" +", " ");
    }

    private String buildFullAddress(CustomerAddress a) {
        String street1 = a.getStreet1() != null ? a.getStreet1() : "";
        String street2 = a.getStreet2() != null ? a.getStreet2() : "";
        String city = a.getCity() != null ? a.getCity() : "";
        String province = a.getProvince() != null ? a.getProvince() : "";
        String postalCode = a.getPostalCode() != null ? a.getPostalCode() : "";

        return (street1 + " " + street2 + ", " + city + ", " + province + " " + postalCode)
                .trim()
                .replaceAll(" +", " ");
    }

    private ResponseEntity<?> bad(String msg) {
        return ResponseEntity.badRequest().body(msg);
    }
}