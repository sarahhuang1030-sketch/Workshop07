package org.example.controller;

import org.example.dto.EmployeeDTO;
import org.example.dto.SaveEmployeeRequestDTO;
import org.example.service.EmployeeService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/employees")
public class ManagerEmployeeController {

    private final EmployeeService employeeService;

    public ManagerEmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public List<EmployeeDTO> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    @GetMapping("/{id}")
    public EmployeeDTO getEmployeeById(@PathVariable Integer id) {
        return employeeService.getEmployeeById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmployeeDTO createEmployee(@RequestBody SaveEmployeeRequestDTO request) {
        return employeeService.createEmployee(request);
    }

    @PutMapping("/{id}")
    public EmployeeDTO updateEmployee(@PathVariable Integer id,
                                      @RequestBody SaveEmployeeRequestDTO request) {
        return employeeService.updateEmployee(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEmployee(@PathVariable Integer id) {
        employeeService.deleteEmployee(id);
    }
}