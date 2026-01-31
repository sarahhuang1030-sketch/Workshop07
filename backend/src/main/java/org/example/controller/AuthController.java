package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.RegisterRequestDTO;
import org.example.service.CustomerRegistrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

//login
import org.example.dto.LoginRequestDTO;
import org.example.dto.LoginResponseDTO;
import org.example.service.CustomerRegistrationService;
import org.example.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final CustomerRegistrationService registrationService;
    private final AuthService authService;

    public AuthController(CustomerRegistrationService registrationService, AuthService authService) {
        this.registrationService = registrationService;
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO req) {
        try {
            LoginResponseDTO user = registrationService.register(req);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO req) {
        try {
            LoginResponseDTO user = authService.login(req.getUsername(), req.getPassword());
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

}
