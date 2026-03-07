package org.example.controller;

import org.example.dto.ManagerSummaryDTO;
import org.example.service.ManagerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    private final ManagerService managerService;

    public ManagerController(ManagerService managerService) {
        this.managerService = managerService;
    }

    @GetMapping("/summary")
    public ManagerSummaryDTO getSummary() {
        return managerService.getSummary();
    }
}