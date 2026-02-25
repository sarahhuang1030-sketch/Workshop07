//email/password register/login

package org.example.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.example.dto.*;
import org.example.service.AuthService;
import org.example.service.CustomerRegistrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.example.dto.CustomerProfileDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

import java.util.Map;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final CustomerRegistrationService registrationService;
    private final AuthService authService;

    private final AuthenticationManager authenticationManager;

    public AuthController(CustomerRegistrationService registrationService,
                          AuthService authService,
                          AuthenticationManager authenticationManager) {
        this.registrationService = registrationService;
        this.authService = authService;
        this.authenticationManager = authenticationManager;
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
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO req,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {

        // Authenticate via Spring Security (this is the real login)
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);

        //make sure the session exists
        request.getSession(true);

        // Save context into session properly
        SecurityContextRepository repo = new HttpSessionSecurityContextRepository();
        repo.saveContext(context, request, response);

        // If you still want to return your DTO:
        LoginResponseDTO user = authService.login(req.getUsername(), req.getPassword());
        return ResponseEntity.ok(user);
    }



    @PostMapping("/forgetpassword")
    public ResponseEntity<?> forgetPassword(@RequestBody ForgetPasswordRequestDTO req) {
        authService.forgetPassword(req.getIdentifier());
        // Always return OK (don’t leak whether account exists)
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resetpassword")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequestDTO req) {
        authService.resetPassword(req.getToken(), req.getNewPassword());
        return ResponseEntity.ok().build();
    }
}
