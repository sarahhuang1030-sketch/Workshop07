package org.example.service;

import org.example.model.Customer;
import org.example.model.PasswordResetToken;
import org.example.model.UserAccount;
import org.example.repository.CustomerRepository;
import org.example.repository.PasswordResetTokenRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;


import org.example.dto.ForgetPasswordRequestDTO;
import org.example.dto.ResetPasswordRequestDTO;
import org.example.model.PasswordResetToken;
import org.example.model.UserAccount;
import org.example.repository.CustomerRepository;
import org.example.repository.PasswordResetTokenRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final CustomerRepository customerRepo;
    private final UserAccountRepository userAccountRepo;
    private final PasswordResetTokenRepository tokenRepo;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    public PasswordResetService(CustomerRepository customerRepo,
                                UserAccountRepository userAccountRepo,
                                PasswordResetTokenRepository tokenRepo,
                                JavaMailSender mailSender,
                                PasswordEncoder passwordEncoder) {
        this.customerRepo = customerRepo;
        this.userAccountRepo = userAccountRepo;
        this.tokenRepo = tokenRepo;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
    }

    public void sendResetLink(String email, String frontendResetUrlBase) {
        // 1) Find customer by email
        var customer = customerRepo.findFirstByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("No customer found with that email"));

        // 2) Find user account by customerId
        UserAccount ua = userAccountRepo.findByCustomerId(customer.getCustomerId())
                .orElseThrow(() -> new RuntimeException("No user account found for that customer"));

        // 3) Create RAW token (DEV MODE)
        String rawToken = UUID.randomUUID().toString();

        PasswordResetToken t = new PasswordResetToken();
        t.setUserId(ua.getUserId());
        t.setToken(rawToken); // stored raw token in token_hash column for now
        //when change to hash comment the above code then uncomment the below one
//        String tokenHash = sha256Hex(rawToken);
//        t.setToken(tokenHash); // still stored in token_hash column

        t.setCreatedAt(LocalDateTime.now());
        t.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        t.setUsed(false);

        tokenRepo.save(t);

        // 4) Email link
        String link = frontendResetUrlBase + "?token=" + rawToken;

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(email);
        msg.setSubject("Reset your TeleConnect password");
        msg.setText("Click this link to reset your password (valid 30 minutes):\n" + link);

        mailSender.send(msg);
    }

    public void resetPassword(String token, String newPassword) {
        // 1) Validate token
        PasswordResetToken t = tokenRepo.findValid(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));
        //uncomment below and comment the above line when doing hash token
//        String tokenHash = sha256Hex(token);
//        PasswordResetToken t = tokenRepo.findValid(tokenHash).orElseThrow(...);



        // 2) Find UserAccount by t.userId
        UserAccount ua = userAccountRepo.findById(t.getUserId())
                .orElseThrow(() -> new RuntimeException("User account not found"));

        // 3) Update password hash
        ua.setPasswordHash(passwordEncoder.encode(newPassword));
        userAccountRepo.save(ua);

        // 4) Mark token used
        t.setUsed(true);
        tokenRepo.save(t);
    }
}

//uncomment this when using hash token
//private static String sha256Hex(String input) {
//    try {
//        MessageDigest md = MessageDigest.getInstance("SHA-256");
//        byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
//        StringBuilder sb = new StringBuilder();
//        for (byte b : digest) sb.append(String.format("%02x", b));
//        return sb.toString();
//    } catch (Exception e) {
//        throw new RuntimeException("SHA-256 not available", e);
//    }
//}

