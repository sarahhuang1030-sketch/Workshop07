package org.example.controller;

import org.example.dto.ManagerAddOnDTO;
import org.example.dto.ManagerAddOnRequestDTO;
import org.example.repository.ManagerAddOnRepository;
import org.example.service.AuditService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/addons")
public class ManagerAddOnController {

    private final ManagerAddOnRepository repo;
    private final AuditService auditService;

    public ManagerAddOnController(ManagerAddOnRepository repo,
                                  AuditService auditService) {
        this.repo = repo;
        this.auditService = auditService;
    }

    @GetMapping
    public List<ManagerAddOnDTO> getAll() {
        return repo.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@RequestBody ManagerAddOnRequestDTO body,
                       Authentication authentication) {

        repo.create(
                body.serviceTypeId(),
                body.addOnName(),
                body.monthlyPrice(),
                body.description()
        );

        String username = authentication.getName();
        auditService.log("AddOn", "Create", body.addOnName(), username);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable int id,
                       Authentication authentication) {

        ManagerAddOnDTO addOn = repo.findAll().stream()
                .filter(a -> a.addOnId() == id)
                .findFirst()
                .orElse(null);

        repo.deleteById(id);

        String username = authentication.getName();
        String target = (addOn != null) ? addOn.addOnName() : "AddOn ID " + id;
        auditService.log("AddOn", "Delete", target, username);
    }

    @PatchMapping("/{id}/active")
    public void toggleActive(@PathVariable int id,
                             @RequestBody ToggleRequest body,
                             Authentication authentication) {

        ManagerAddOnDTO addOn = repo.findAll().stream()
                .filter(a -> a.addOnId() == id)
                .findFirst()
                .orElse(null);

        repo.updateActive(id, body.isActive());

        String username = authentication.getName();
        String action = body.isActive() ? "Activate" : "Deactivate";
        String target = (addOn != null) ? addOn.addOnName() : "AddOn ID " + id;

        auditService.log("AddOn", action, target, username);
    }

    record ToggleRequest(boolean isActive) {}

    @PutMapping("/{id}")
    public void update(@PathVariable int id,
                       @RequestBody ManagerAddOnRequestDTO body,
                       Authentication authentication) {

        repo.update(
                id,
                body.serviceTypeId(),
                body.addOnName(),
                body.monthlyPrice(),
                body.description()
        );

        String username = authentication.getName();
        auditService.log("AddOn", "Update", body.addOnName(), username);
    }

    @GetMapping("/{id}")
    public ManagerAddOnDTO getById(@PathVariable int id) {
        return repo.findById(id);
    }
}