package org.example.service;

import org.example.dto.EmployeeDTO;
import org.example.dto.SaveEmployeeRequestDTO;
import org.example.model.Employee;
import org.example.model.Role;
import org.example.repository.EmployeeRepository;
import org.example.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;

    public EmployeeService(EmployeeRepository employeeRepository,
                           RoleRepository roleRepository) {
        this.employeeRepository = employeeRepository;
        this.roleRepository=roleRepository;
    }

    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public EmployeeDTO getEmployeeById(Integer id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));

        return toDTO(employee);
    }

    public EmployeeDTO createEmployee(SaveEmployeeRequestDTO request) {
        Employee employee = new Employee();
        apply(employee, request);
        return toDTO(employeeRepository.save(employee));
    }

    public EmployeeDTO updateEmployee(Integer id, SaveEmployeeRequestDTO request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));

        apply(employee, request);
        return toDTO(employeeRepository.save(employee));
    }

    public void deleteEmployee(Integer id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));

        employeeRepository.delete(employee);
    }

    private void apply(Employee employee, SaveEmployeeRequestDTO request) {
        employee.setPrimaryLocationId(request.getPrimaryLocationId());

        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setPhone(request.getPhone());
//        employee.setRole(request.getRole());
        Role role = roleRepository.findByRoleName(request.getRole())
                .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + request.getRole()));

        employee.setRole(role);
        employee.setSalary(request.getSalary());
        employee.setHireDate(request.getHireDate());
        employee.setStatus(request.getStatus());
        employee.setActive(request.getActive());
        employee.setManagerId(request.getManagerId());
    }

    private EmployeeDTO toDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setEmployeeId(employee.getEmployeeId());
        dto.setPrimaryLocationId(employee.getPrimaryLocationId());

        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setEmail(employee.getEmail());
        dto.setPhone(employee.getPhone());
        dto.setRole(
                employee.getRole() != null ? employee.getRole().getRoleName() : null
        );
        dto.setSalary(employee.getSalary());
        dto.setHireDate(employee.getHireDate());
        dto.setStatus(employee.getStatus());
        dto.setActive(employee.getActive());
        dto.setManagerId(employee.getManagerId());
        return dto;
    }
}