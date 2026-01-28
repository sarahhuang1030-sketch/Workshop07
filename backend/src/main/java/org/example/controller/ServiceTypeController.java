package org.example.controller;

import org.example.dto.ServiceTypeDTO;
import org.example.repository.ServiceTypeRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-types")
public class ServiceTypeController {

    private final ServiceTypeRepository repo;

    public ServiceTypeController(ServiceTypeRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<ServiceTypeDTO> getAllServiceTypes() {
        return repo.findAll();
    }
}
