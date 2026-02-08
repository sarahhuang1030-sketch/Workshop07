package org.example.service;

import org.example.dto.LoginResponseDTO;
import org.example.model.Customer;
import org.example.model.Employee;
import org.example.model.UserAccount;
import org.example.repository.CustomerRepository;
import org.example.repository.EmployeeRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.example.model.PasswordResetToken;
import org.example.repository.PasswordResetTokenRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDateTime;
import java.util.UUID;


@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JavaMailSender mailSender;

    public AuthService(
            UserAccountRepository userAccountRepository,
            CustomerRepository customerRepository,
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder,
            PasswordResetTokenRepository passwordResetTokenRepository,
            JavaMailSender mailSender
    ) {
        this.userAccountRepository = userAccountRepository;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.mailSender = mailSender;
    }

    public LoginResponseDTO login(String usernameRaw, String passwordRaw) {
        String username = usernameRaw.trim().toLowerCase();

        UserAccount ua = userAccountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(passwordRaw, ua.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        // Customer login
        if (ua.getCustomerId() != null) {
            Customer customer = customerRepository.findById(ua.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer record not found"));

            return new LoginResponseDTO(
                    customer.getCustomerId(),
                    null,
                    customer.getFirstName(),
                    ua.getUsername(),
                    ua.getRole()
            );
        }

        // Employee login
        if (ua.getEmployeeId() != null) {
            Employee emp = employeeRepository.findById(ua.getEmployeeId())
                    .orElseThrow(() -> new IllegalArgumentException("Employee record not found"));

            return new LoginResponseDTO(
                    null,
                    emp.getEmployeeId(), // adjust if already Long
                    emp.getFirstName(),
                    ua.getUsername(),
                    ua.getRole()
            );
        }

        // If neither linked (should not happen)
        throw new IllegalStateException("User account is not linked to a customer or employee");
    }



    @Value("${app.resetPasswordUrl:http://localhost:5173/resetpassword}")
    private String resetPasswordUrl;

    public void forgetPassword(String identifier) {
        System.out.println("[forgetPassword] raw=" + identifier);
        if (identifier == null) return;

        String trimmed = identifier.trim();
        System.out.println("[forgetPassword] trimmed=" + trimmed);
        if (trimmed.isEmpty()) return;

        UserAccount ua = userAccountRepository.findByUsernameIgnoreCase(trimmed).orElse(null);
        System.out.println("[forgetPassword] ua=" + (ua != null));

        String email = null;

        if (ua != null) {
            System.out.println("[forgetPassword] customerId=" + ua.getCustomerId() + " employeeId=" + ua.getEmployeeId());

            if (ua.getCustomerId() != null) {
                email = customerRepository.findById(ua.getCustomerId()).map(Customer::getEmail).orElse(null);
            } else if (ua.getEmployeeId() != null) {
                email = employeeRepository.findById(ua.getEmployeeId()).map(Employee::getEmail).orElse(null);
            }
        } else {
            // They might have typed an email. Find which customer/employee owns it...
            Integer customerId = customerRepository.findFirstByEmailIgnoreCase(trimmed)
                    .map(Customer::getCustomerId)
                    .orElse(null);

            Integer employeeId = null;
            if (customerId == null) {
                employeeId = employeeRepository.findFirstByEmailIgnoreCase(trimmed)
                        .map(Employee::getEmployeeId)
                        .orElse(null);
            }

            // ...then map that back to a user account
            if (customerId != null) {
                ua = userAccountRepository.findByCustomerId(customerId).orElse(null);
                email = trimmed; // or fetch from customer table to normalize
            } else if (employeeId != null) {
                ua = userAccountRepository.findByEmployeeId(employeeId).orElse(null);
                email = trimmed;
            }

            System.out.println("[forgetPassword] email lookup => ua=" + (ua != null));

            // security-friendly: if still not found, just stop
            if (ua == null) {
                System.out.println("[forgetPassword] no matching user account; not sending.");
                return;
            }
        }

        System.out.println("[forgetPassword] resolved email=" + email);
        if (email == null || email.isBlank()) return;

        // ✅ create token row
        String token = UUID.randomUUID().toString();

        PasswordResetToken prt = new PasswordResetToken();
        prt.setUserId(ua.getUserId()); // if getUserId() is Integer; adjust if already Long
        prt.setToken(token);
        prt.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        prt.setUsed(false);

        passwordResetTokenRepository.save(prt);

        // ✅ send email
        String link = resetPasswordUrl + "?token=" + token;

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(email);
        msg.setSubject("Reset your password");
        msg.setText("Click this link to reset your password:\n\n" + link + "\n\nThis link expires in 30 minutes.");

        try {
            mailSender.send(msg);
            System.out.println("[forgetPassword] Sent reset link to: " + email);
        } catch (Exception e) {
            System.out.println("[forgetPassword] FAILED to send email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken prt = passwordResetTokenRepository.findValid(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        UserAccount ua = userAccountRepository.findById(prt.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        ua.setPasswordHash(passwordEncoder.encode(newPassword));
        userAccountRepository.save(ua);

        prt.setUsed(true);
        passwordResetTokenRepository.save(prt);
    }

}
