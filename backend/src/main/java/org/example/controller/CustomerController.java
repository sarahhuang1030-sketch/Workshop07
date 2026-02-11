package org.example.controller;

import java.security.Principal;

import org.example.dto.CustomerProfileDTO;
import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final UserAccountRepository userAccountRepo;

    public CustomerController(UserAccountRepository userAccountRepo) {
        this.userAccountRepo = userAccountRepo;
    }



    @GetMapping("/{customerId}/profile")
    public ResponseEntity<?> getProfile(
            @PathVariable Integer customerId,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        // Find logged-in user
        UserAccount ua = userAccountRepo
                .findByUsernameIgnoreCase(principal.getName())
                .orElse(null);

        if (ua == null || ua.getCustomerId() == null) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        // 🔒 Prevent accessing someone else’s profile
        if (!ua.getCustomerId().equals(customerId)) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        // ✅ Create DTO INSTANCE
        CustomerProfileDTO dto = new CustomerProfileDTO(
                ua.getCustomerId(),
                ua.getEmployeeId(),
                ua.getRole()
                // add more fields later
        );

        return ResponseEntity.ok(dto);
    }
}
