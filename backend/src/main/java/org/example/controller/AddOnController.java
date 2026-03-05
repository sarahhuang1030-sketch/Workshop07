package org.example.controller;

import org.example.dto.AddOnDTO;
import org.example.repository.AddOnRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addons")
public class AddOnController {

    private final AddOnRepository repo;

    public AddOnController(AddOnRepository repo) {
        this.repo = repo;
    }

    // GET /api/addons              -> all active addons
    // GET /api/addons?planId=123   -> only addons allowed for that plan
    @GetMapping
    public List<AddOnDTO> getAddOns(@RequestParam(required = false) Integer planId) {
        if (planId != null) {
            return repo.findActiveAddOnsByPlanId(planId);
        }
        return repo.findAllActiveAddOns();
    }
}