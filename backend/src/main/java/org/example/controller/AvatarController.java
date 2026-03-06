package org.example.controller;

import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.example.service.AvatarStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/me")
public class AvatarController {

    private final UserAccountRepository userAccountRepo;
    private final AvatarStorageService avatarStorageService;

    public AvatarController(UserAccountRepository userAccountRepo,
                            AvatarStorageService avatarStorageService) {
        this.userAccountRepo = userAccountRepo;
        this.avatarStorageService = avatarStorageService;
    }

    @PutMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadAvatar(
            @RequestParam("avatar") MultipartFile avatar,
            Principal principal,
            Authentication auth,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) throws IOException {

        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        String key = resolveLoginKey(principal, auth, oauthUser);
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        String publicUrl = avatarStorageService.saveUploadedAvatar(ua, avatar);
        return Map.of("avatarUrl", publicUrl);
    }

    @DeleteMapping("/avatar")
    public Map<String, Boolean> deleteAvatar(
            Principal principal,
            Authentication auth,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) throws IOException {

        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        String key = resolveLoginKey(principal, auth, oauthUser);
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        avatarStorageService.deleteAvatar(ua);
        return Map.of("ok", true);
    }

    private String resolveLoginKey(Principal principal, Authentication auth, OAuth2User oauthUser) {
        if (auth instanceof OAuth2AuthenticationToken oauthTok) {
            Map<String, Object> attrs = oauthUser != null ? oauthUser.getAttributes() : Map.of();
            String provider = oauthTok.getAuthorizedClientRegistrationId().toLowerCase();

            String externalId = firstNonBlank(
                    str(attrs.get("sub")),
                    str(attrs.get("id")),
                    str(attrs.get("login"))
            );

            if (externalId != null && !externalId.isBlank()) {
                return (provider + ":" + externalId).toLowerCase();
            }
        }
        return principal.getName();
    }

    private static String str(Object o) {
        return o == null ? null : o.toString().trim();
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.trim().isEmpty()) return v.trim();
        }
        return null;
    }
}