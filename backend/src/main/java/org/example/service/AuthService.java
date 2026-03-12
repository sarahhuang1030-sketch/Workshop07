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
  //  private final PasswordEncoder passwordEncoder;
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
    //    this.passwordEncoder = passwordEncoder;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.mailSender = mailSender;
    }

    public LoginResponseDTO login(String usernameRaw, String passwordRaw) {
        String username = usernameRaw.trim().toLowerCase();

        UserAccount ua = userAccountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));


        //hash password
//        if (!passwordEncoder.matches(passwordRaw, ua.getPasswordHash())) {
//            throw new IllegalArgumentException("Invalid username or password");
//        }

        //raw password
        if (!passwordRaw.equals(ua.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }



        // Customer login
        if (ua.getCustomerId() != null) {
            Customer customer = customerRepository.findById(ua.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer record not found"));

            return new LoginResponseDTO(
                    null,
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


        // ✅ create RAW token (emailed) + HASH (stored)
        String token = UUID.randomUUID().toString();
        String tokenHash = sha256Hex(token);

        PasswordResetToken prt = new PasswordResetToken();
        prt.setUserId(ua.getUserId());
        prt.setTokenHash(tokenHash);                 // ✅ store HASH in token_hash
        prt.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        prt.setUsed(false);

        passwordResetTokenRepository.save(prt);

// ✅ send email with RAW token
        String link = resetPasswordUrl + "?token=" + token;

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(email);
        msg.setFrom("sarahhuang1030@gmail.com");
        msg.setSubject("Reset your password");
        msg.setText("Click this link to reset your password:\n\n" + link + "\n\nThis link expires in 30 minutes.");

        System.out.println("[mail] sending to " + email);

        try {
            mailSender.send(msg);
            System.out.println("[mail] send() returned OK");
        } catch (org.springframework.mail.MailException e) {
            System.out.println("[mail] FAILED (MailException): " + e.getMessage());
            e.printStackTrace();
        } catch (Throwable t) {
            System.out.println("[mail] FAILED (Throwable): " + t.getClass().getName() + " - " + t.getMessage());
            t.printStackTrace();
        }
    }

    public void resetPassword(String rawToken, String newPassword) {
        String tokenHash = sha256Hex(rawToken);

        PasswordResetToken prt = passwordResetTokenRepository.findValid(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        UserAccount ua = userAccountRepository.findById(prt.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));


        //hash password
//        ua.setPasswordHash(passwordEncoder.encode(newPassword));
        //raw password
        ua.setPasswordHash(newPassword);
        userAccountRepository.save(ua);

        prt.setUsed(true);
        passwordResetTokenRepository.save(prt);
    }

    public static String sha256Hex(String input) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}