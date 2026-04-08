package org.example.service;

import org.example.dto.CreateEmployeeResponseDTO;
import org.example.dto.EmployeeDTO;
import org.example.dto.SaveEmployeeRequestDTO;
import org.example.model.Employee;
import org.example.model.Role;
import org.example.model.UserAccount;
import org.example.repository.EmployeeRepository;
import org.example.repository.RoleRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.example.repository.LocationRepository locationRepository;

    public EmployeeService(EmployeeRepository employeeRepository,
                           RoleRepository roleRepository,
                           UserAccountRepository userAccountRepository,
                           PasswordEncoder passwordEncoder,
                           org.example.repository.LocationRepository locationRepository) {
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.locationRepository = locationRepository;
    }

    public List<EmployeeDTO> getAllEmployees() {
        List<Employee> employees = employeeRepository.findAll();
        java.util.Map<Integer, String> locationNames = new java.util.HashMap<>();
        java.util.Map<Integer, String> employeeNames = new java.util.HashMap<>();

        employees.forEach(e -> {
            if (e.getPrimaryLocationId() != null) locationNames.put(e.getPrimaryLocationId(), null);
            employeeNames.put(e.getEmployeeId(), (e.getFirstName() != null ? e.getFirstName() : "") + " " + (e.getLastName() != null ? e.getLastName() : ""));
        });

        locationNames.keySet().forEach(id -> {
            locationRepository.findById(id).ifPresent(loc -> locationNames.put(id, loc.getLocationName()));
        });

        return employees.stream()
                .map(e -> {
                    EmployeeDTO dto = toDTO(e);
                    dto.setPrimaryLocationName(locationNames.get(e.getPrimaryLocationId()));
                    dto.setManagerName(employeeNames.get(e.getManagerId()));
                    return dto;
                })
                .toList();
    }

    public EmployeeDTO getEmployeeById(Integer id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));

        return toDTO(employee);
    }

    @Transactional
    public CreateEmployeeResponseDTO createEmployee(SaveEmployeeRequestDTO request) {
        Employee employee = new Employee();
        apply(employee, request);

        Employee savedEmployee = employeeRepository.save(employee);

        String tempPassword = generateTemporaryPassword();
        String username = generateUniqueUsername(savedEmployee);

        UserAccount userAccount = new UserAccount();
        userAccount.setEmployeeId(savedEmployee.getEmployeeId());
        userAccount.setCustomerId(null);
        userAccount.setUsername(username);
        userAccount.setPasswordHash(passwordEncoder.encode(tempPassword));
        userAccount.setIsLocked(0);
        userAccount.setIsActive(true);
        userAccount.setMustChangePassword(true);
        userAccount.setTempPasswordExpiresAt(LocalDateTime.now().plusDays(3));
        userAccount.setPasswordChangedAt(null);
        userAccount.setRole(savedEmployee.getRole());

        userAccountRepository.save(userAccount);

        CreateEmployeeResponseDTO dto = new CreateEmployeeResponseDTO();
        dto.setEmployeeId(savedEmployee.getEmployeeId());
        dto.setFirstName(savedEmployee.getFirstName());
        dto.setLastName(savedEmployee.getLastName());
        dto.setEmail(savedEmployee.getEmail());
        dto.setRole(savedEmployee.getRole() != null ? savedEmployee.getRole().getRoleName() : null);
        dto.setUsername(username);
        dto.setTempPassword(tempPassword);

        return dto;
    }

    public EmployeeDTO updateEmployee(Integer id, SaveEmployeeRequestDTO request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));

        apply(employee, request);
        return toDTO(employeeRepository.save(employee));
    }

    @Transactional
    public void deleteEmployee(Integer id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));

        userAccountRepository.findByEmployeeId(id)
                .ifPresent(userAccountRepository::delete);

        employeeRepository.delete(employee);
    }

    private void apply(Employee employee, SaveEmployeeRequestDTO request) {
        employee.setPrimaryLocationId(request.getPrimaryLocationId());
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setPhone(request.getPhone());

        Role role = roleRepository.findByRoleName(request.getRole())
                .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + request.getRole()));

        employee.setRole(role);
        employee.setSalary(request.getSalary());
        employee.setHireDate(request.getHireDate());
        employee.setStatus(request.getStatus());
        employee.setActive(request.getActive() != null ? request.getActive() : 1);
        employee.setManagerId(request.getManagerId());
    }

    private EmployeeDTO toDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setEmployeeId(employee.getEmployeeId());
        dto.setPrimaryLocationId(employee.getPrimaryLocationId());

        // We'll handle primaryLocationName and managerName in bulk or as needed
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setEmail(employee.getEmail());
        dto.setPhone(employee.getPhone());
        dto.setRole(employee.getRole() != null ? employee.getRole().getRoleName() : null);
        dto.setSalary(employee.getSalary());
        dto.setHireDate(employee.getHireDate());
        dto.setStatus(employee.getStatus());
        dto.setActive(employee.getActive());
        dto.setManagerId(employee.getManagerId());

        return dto;
    }

    private String generateTemporaryPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$!";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }

        return sb.toString();
    }

    private String generateUniqueUsername(Employee employee) {
        String first = employee.getFirstName() != null ? employee.getFirstName().trim().toLowerCase(Locale.US) : "";
        String last = employee.getLastName() != null ? employee.getLastName().trim().toLowerCase(Locale.US) : "";

        String base = (first.isEmpty() ? "employee" : first) + "." + (last.isEmpty() ? "user" : last);
        base = base.replaceAll("[^a-z0-9.]", "");

        String candidate = base;
        int counter = 1;

        while (userAccountRepository.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + counter;
            counter++;
        }

        return candidate;
    }
}