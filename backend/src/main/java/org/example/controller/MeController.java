package org.example.controller;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;

import org.example.dto.RegisterAsCustomerRequestDTO;
import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.example.service.AgentCustomerService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
public class MeController {

    private final UserAccountRepository userAccountRepo;
    private final AgentCustomerService agentCustomerService;

    public MeController(UserAccountRepository userAccountRepo,
                        AgentCustomerService agentCustomerService) {
        this.userAccountRepo = userAccountRepo;
        this.agentCustomerService = agentCustomerService;
    }

    @GetMapping("/api/me")
    public Object me(Principal principal,
                     OAuth2AuthenticationToken oauth,
                     @AuthenticationPrincipal OAuth2User oauthUser) {

        if (principal == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        // key used for DB lookup:
        String key = principal.getName();
        if (oauth != null && oauthUser != null) {
            Object email = oauthUser.getAttributes().get("email");
            if (email != null) key = email.toString();
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("name", principal.getName());
        out.put("lookupKey", key); // helpful for debugging; remove later if you want

        // ✅ Now ua is defined
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key).orElse(null);
        if (ua != null) {
            out.put("employeeId", ua.getEmployeeId());
            out.put("customerId", ua.getCustomerId());
            out.put("role", ua.getRole());
        } else {
            out.put("employeeId", null);
            out.put("customerId", null);
            out.put("role", null);
        }

        if (oauth != null && oauthUser != null) {
            out.put("provider", oauth.getAuthorizedClientRegistrationId());
            out.put("attributes", oauthUser.getAttributes());
        }

        return out;
    }

    @PostMapping("/api/me/register-as-customer")
    public Object registerAsCustomer(Principal principal,
                                     OAuth2AuthenticationToken oauth,
                                     @AuthenticationPrincipal OAuth2User oauthUser,
                                     @RequestBody RegisterAsCustomerRequestDTO req) {

        if (principal == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        String key = principal.getName();
        if (oauth != null && oauthUser != null) {
            Object email = oauthUser.getAttributes().get("email");
            if (email != null) key = email.toString();
        }

        return agentCustomerService.registerAsCustomer(key, req);
    }
}
