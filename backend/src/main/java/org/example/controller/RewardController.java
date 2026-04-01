package org.example.controller;

import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rewards")
public class RewardController {

    private final UserAccountRepository userRepo;

    public RewardController(UserAccountRepository userRepo) {
        this.userRepo = userRepo;
    }

    @GetMapping("/points")
    public ResponseEntity<Integer> getPoints(Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String username = auth.getName().toLowerCase().trim();

        UserAccount user = userRepo.findByUsernameIgnoreCase(username)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                user.getPoints() == null ? 0 : user.getPoints()
        );
    }
}