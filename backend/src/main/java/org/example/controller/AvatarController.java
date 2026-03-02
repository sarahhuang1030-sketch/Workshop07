package org.example.controller;

import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
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
import java.nio.file.*;
import java.security.Principal;
import java.util.Map;
@RestController
@RequestMapping("/api/me")
public class AvatarController {

    @Value("${app.upload-dir}")
    private String uploadDir;

    private final UserAccountRepository userAccountRepo;

    public AvatarController(UserAccountRepository userAccountRepo) {
        this.userAccountRepo = userAccountRepo;
    }

    @PutMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadAvatar(
            @RequestParam("avatar") MultipartFile avatar,
            Principal principal,
            Authentication auth,
            @AuthenticationPrincipal OAuth2User oauthUser
    )throws IOException {

        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        if (avatar == null || avatar.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");

        String contentType = avatar.getContentType() == null ? "" : avatar.getContentType();
        if (!contentType.startsWith("image/"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must be an image");

        String key = resolveLoginKey(principal, auth, oauthUser);
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        // ✅ writes to backend/src/uploads/avatars (if uploadDir=src/uploads)
        Path avatarsDir = Paths.get(uploadDir, "avatars").toAbsolutePath().normalize();
        Files.createDirectories(avatarsDir);

        String ext = contentType.contains("png") ? "png"
                : (contentType.contains("jpeg") || contentType.contains("jpg")) ? "jpg"
                : "img";

        String fileName = "user_" + ua.getUserId() + "." + ext;

        Path target = avatarsDir.resolve(fileName).normalize();
        if (!target.startsWith(avatarsDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
        }

        // ✅ delete old file if it exists and is different
        String oldUrl = ua.getAvatarUrl();
        if (oldUrl != null && oldUrl.startsWith("/uploads/avatars/")) {
            String oldFile = oldUrl.substring("/uploads/avatars/".length());
            Path oldPath = avatarsDir.resolve(oldFile).normalize();
            if (oldPath.startsWith(avatarsDir) && Files.exists(oldPath) && !oldPath.equals(target)) {
                Files.delete(oldPath);
            }
        }

        Files.copy(avatar.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // ✅ URL clients request (matches your StaticResourceConfig mapping)
        String publicUrl = "/uploads/avatars/" + fileName;

        ua.setAvatarUrl(publicUrl);
        userAccountRepo.save(ua);

        return Map.of("avatarUrl", publicUrl);
    }

    @DeleteMapping("/avatar")
    public Map<String, Boolean> deleteAvatar(
            Principal principal,
            Authentication auth,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) throws IOException {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        String key = resolveLoginKey(principal, auth, oauthUser);
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        Path avatarsDir = Paths.get(uploadDir, "avatars").toAbsolutePath().normalize();

        String url = ua.getAvatarUrl();
        if (url != null && url.startsWith("/uploads/avatars/")) {
            String file = url.substring("/uploads/avatars/".length());
            Path path = avatarsDir.resolve(file).normalize();
            if (path.startsWith(avatarsDir) && Files.exists(path)) {
                Files.delete(path);
            }
        }

        ua.setAvatarUrl(null);
        userAccountRepo.save(ua);

        return Map.of("ok", true);
    }

    //--------------helper method----------------
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
