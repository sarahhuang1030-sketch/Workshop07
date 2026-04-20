package org.example.controller;

import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
//this is for local file storage, we will replace it with Azure Blob Storage
//import org.example.service.AvatarStorageService;
import org.example.service.AzureBlobService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/me")
public class AvatarController {

    private final UserAccountRepository userAccountRepo;
//    private final AvatarStorageService avatarStorageService;
    private final AzureBlobService azureBlobService;


    public AvatarController(UserAccountRepository userAccountRepo,
//                            AvatarStorageService avatarStorageService,
                            AzureBlobService azureBlobService) {
        this.userAccountRepo = userAccountRepo;
//        this.avatarStorageService = avatarStorageService;
        this.azureBlobService=azureBlobService;
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

//        String publicUrl = avatarStorageService.saveUploadedAvatar(ua, avatar);
        String publicUrl = azureBlobService.saveUploadedAvatar(ua, avatar);
        return Map.of("avatarUrl", publicUrl);
    }

    @DeleteMapping("/avatar")
    public ResponseEntity<?> deleteAvatar(
            Principal principal,
            Authentication auth,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        try {
            if (principal == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
            }

            String key = resolveLoginKey(principal, auth, oauthUser);
            UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

            azureBlobService.deleteAvatar(ua);

            return ResponseEntity.ok(Map.of(
                    "ok", true,
                    "message", "Avatar deleted successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "ok", false,
                            "message", "Delete failed: " + e.getMessage()
                    ));
        }
    }


    // this is to allow andriod app to upload the profile picture
//    @PostMapping(value = "/avatar", consumes = "multipart/form-data")
//    public ResponseEntity<?> uploadAvatar(Authentication authentication,
//                                          @RequestParam("file") MultipartFile file) {
//        try {
//            String username = authentication.getName();
//
//            UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(username)
//                    .orElseThrow(() -> new RuntimeException("User not found"));
//
//            String avatarUrl = avatarStorageService.saveUploadedAvatar(ua, file);
//            ua.setAvatarUrl(avatarUrl);
//            userAccountRepo.save(ua);
//
//            Map<String, Object> out = new HashMap<>();
//            out.put("avatarUrl", avatarUrl);
//            out.put("message", "Avatar uploaded successfully");
//
//            return ResponseEntity.ok(out);
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
//        }
//    }

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