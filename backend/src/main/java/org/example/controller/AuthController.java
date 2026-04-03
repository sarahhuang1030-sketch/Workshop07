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
import org.example.security.JwtService;
import org.example.service.AuditService;
import org.example.service.AuthService;
import org.example.service.CustomerRegistrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final CustomerRegistrationService registrationService;
    private final AuthService authService;

    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;
    private final JwtService jwtService;

    public AuthController(CustomerRegistrationService registrationService,
                          AuthService authService,
                          AuthenticationManager authenticationManager,
                          AuditService auditService,
                          JwtService jwtService) {
        this.registrationService = registrationService;
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.auditService = auditService;
        this.jwtService = jwtService;
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
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO req) {

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.getUsername(),
                        req.getPassword()
                )
        );

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String token = jwtService.generateToken(userDetails);

        LoginResponseDTO user = authService.login(req.getUsername(), req.getPassword());

        LoginResponseDTO response = new LoginResponseDTO(
                token,
                user.getCustomerId(),
                user.getEmployeeId(),
                user.getFirstName(),
                user.getLastName(),
                user.getUsername(),
                user.getRole(),
                user.getMustChangePassword()
        );

        String username = user.getUsername();
        auditService.log("User", "Login", username, username);

        return ResponseEntity.ok(response);
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
    public ResponseEntity<?> logout(Authentication authentication) {

        if (authentication != null) {
            String username = authentication.getName();
            auditService.log("User", "Logout", username, username);
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/change-password-first-login")
    public ResponseEntity<?> changePasswordFirstLogin(
            @RequestBody FirstLoginPasswordChangeRequestDTO req,
            Authentication authentication
    ) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        authService.changePasswordFirstLogin(authentication.getName(), req);
        return ResponseEntity.ok("Password updated successfully");
    }
}
