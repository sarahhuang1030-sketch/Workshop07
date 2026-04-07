package org.example.controller;

import org.example.dto.PhoneDTO;
import org.example.service.PhoneService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/phones")
@CrossOrigin
public class PhoneController {

    private final PhoneService phoneService;

    public PhoneController(PhoneService phoneService) {
        this.phoneService = phoneService;
    }

    @GetMapping
    public ResponseEntity<List<PhoneDTO>> getAllPhones() {
        return ResponseEntity.ok(phoneService.getAllActivePhones());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PhoneDTO> getPhoneById(@PathVariable Integer id) {
        PhoneDTO phone = phoneService.getPhoneById(id);
        if (phone == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(phone);
    }
}