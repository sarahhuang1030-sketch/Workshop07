/**
 Description: This Controller class is responsible for handling authentication-related endpoints,
 including user registration, login, password reset requests, and password resets. It interacts with the
 CustomerRegistrationService for registering new users and the AuthService for handling login and password reset logic.
 The controller also manages the security context for authenticated sessions.

 Created by: Sarah
 Created on: February 2026
 **/
package org.example.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.example.dto.*;
import org.example.service.AuditService;
import org.example.service.AuthService;
import org.example.service.CustomerRegistrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
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
    private final AuditService auditService;


    public AuthController(CustomerRegistrationService registrationService,
                          AuthService authService,
                          AuthenticationManager authenticationManager,
                          AuditService auditService) {
        this.registrationService = registrationService;
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.auditService = auditService;
    }


    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO req) {
        try {
            LoginResponseDTO user = registrationService.register(req);

            String username = user.getUsername();
            auditService.log("User", "Register", username, username);

            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

//    @PostMapping("/login")
//    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO req,
//                                   HttpServletRequest request,
//                                   HttpServletResponse response) {
//
//        Authentication auth = authenticationManager.authenticate(
//                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
//        );
//
//        SecurityContext context = SecurityContextHolder.createEmptyContext();
//        context.setAuthentication(auth);
//        SecurityContextHolder.setContext(context);
//
//        HttpSession session = request.getSession(true);
//
//        SecurityContextRepository repo = new HttpSessionSecurityContextRepository();
//        repo.saveContext(context, request, response);
//
//        session.setAttribute("SPRING_SECURITY_CONTEXT", context);  // explicit save
//
//        LoginResponseDTO user = authService.login(req.getUsername(), req.getPassword());
//        return ResponseEntity.ok(user);
//    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO req,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        HttpSessionSecurityContextRepository repo = new HttpSessionSecurityContextRepository();
        repo.saveContext(context, request, response);

        LoginResponseDTO user = authService.login(req.getUsername(), req.getPassword());

        String username = user.getUsername();
        auditService.log("User", "Login", username, username);
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

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication,
                                    HttpServletRequest request,
                                    HttpServletResponse response) {

        if (authentication != null) {
            String username = authentication.getName();
            auditService.log("User", "Logout", username, username);

            new SecurityContextLogoutHandler().logout(request, response, authentication);
        }

        return ResponseEntity.ok().build();
    }
}
