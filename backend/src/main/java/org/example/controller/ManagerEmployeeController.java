package org.example.controller;

import org.example.dto.CreateEmployeeResponseDTO;
import org.example.dto.EmployeeDTO;
import org.example.dto.SaveEmployeeRequestDTO;
import org.example.model.Employee;
import org.example.model.UserAccount;
import org.example.service.EmployeeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.example.repository.EmployeeRepository;
import org.example.repository.UserAccountRepository;
import org.example.service.AvatarStorageService;
import java.io.IOException;
import java.util.List;
import java.util.Map;



@RestController
@RequestMapping("/api/manager/employees")
public class ManagerEmployeeController {

    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;
    private final UserAccountRepository userAccountRepository;
    private final AvatarStorageService avatarStorageService;

    public ManagerEmployeeController(EmployeeService employeeService,
                                     EmployeeRepository employeeRepository,
                                     UserAccountRepository userAccountRepository,
                                     AvatarStorageService avatarStorageService) {
        this.employeeService = employeeService;
        this.employeeRepository= employeeRepository;
        this.userAccountRepository=userAccountRepository;
        this.avatarStorageService=avatarStorageService;
    }

    @GetMapping
    public List<EmployeeDTO> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    @GetMapping("/{id}")
    public EmployeeDTO getEmployeeById(@PathVariable Integer id) {
        return employeeService.getEmployeeById(id);
    }

//    @PostMapping
//    @ResponseStatus(HttpStatus.CREATED)
//    public EmployeeDTO createEmployee(@RequestBody SaveEmployeeRequestDTO request) {
//        return employeeService.createEmployee(request);
//    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateEmployeeResponseDTO createEmployee(@RequestBody SaveEmployeeRequestDTO request) {
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

    @PostMapping("/{id}/avatar")
    public ResponseEntity<?> uploadEmployeeAvatar(
            @PathVariable Integer id,
            @RequestParam("avatar") MultipartFile avatar
    ) throws IOException {

        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        UserAccount ua = userAccountRepository.findByEmployeeId(emp.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found"));

        String avatarUrl = avatarStorageService.saveUploadedAvatar(ua, avatar);
        return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl));
    }
}