package org.example.controller;

import org.example.dto.ServiceTypeDTO;
import org.example.repository.ServiceTypeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/manager/servicetypes")
public class ManagerServiceTypeController {

    private final ServiceTypeRepository serviceTypeRepository;

    public ManagerServiceTypeController(ServiceTypeRepository serviceTypeRepository) {
        this.serviceTypeRepository = serviceTypeRepository;
    }

    @GetMapping
    public ResponseEntity<List<ServiceTypeDTO>> getAllServiceTypes() {
        return ResponseEntity.ok(serviceTypeRepository.findAll());
    }
}