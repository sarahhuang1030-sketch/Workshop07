package org.example.service;

import org.example.dto.LoginResponseDTO;
import org.example.model.Customer;
import org.example.model.UserAccount;
import org.example.repository.CustomerRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserAccountRepository userAccountRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userAccountRepository = userAccountRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponseDTO login(String usernameRaw, String passwordRaw) {
        String username = usernameRaw.trim().toLowerCase();

        // 1️⃣ Find user account
        UserAccount ua = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        // 2️⃣ Verify password
        if (!passwordEncoder.matches(passwordRaw, ua.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        // 3️⃣ Load customer using customerId
        Customer customer = customerRepository.findById(ua.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer record not found"));

        // 4️⃣ Build response DTO
        return new LoginResponseDTO(
                customer.getCustomerId(),
                customer.getFirstName(),
                ua.getUsername()
        );
    }
}
