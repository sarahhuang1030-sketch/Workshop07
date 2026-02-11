//email/password register/login

package org.example.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.example.dto.*;
import org.example.service.AuthService;
import org.example.service.CustomerRegistrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.example.dto.CustomerProfileDTO;

@RestController
@RequestMapping("/api/auth")
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

    // forgot password endpoint
    @PostMapping("/forgetpassword")
    public ResponseEntity<?> forgetPassword(@Valid @RequestBody ForgetPasswordRequestDTO req) {
        try {
            authService.forgetPassword(req.getIdentifier());
        } catch (Exception e) {
            e.printStackTrace(); // <-- this will reveal the REAL 500 reason in console
        }
        // Always return same message (security)
        return ResponseEntity.ok("If an account exists, a reset link has been sent.");
    }

    @PostMapping("/resetpassword")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req.token(), req.newPassword());
        return ResponseEntity.ok().build();
    }

    public record ResetPasswordRequest(String token, String newPassword) {}


}
