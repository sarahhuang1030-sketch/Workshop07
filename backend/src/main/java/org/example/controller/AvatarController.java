package org.example.controller;

import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    private final UserAccountRepository userAccountRepo;

    public AvatarController(UserAccountRepository userAccountRepo) {
        this.userAccountRepo = userAccountRepo;
    }

    @PutMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadAvatar(
            @RequestParam("avatar") MultipartFile avatar,
            Principal principal
    ) throws IOException {

        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        if (avatar == null || avatar.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }

        String contentType = avatar.getContentType() == null ? "" : avatar.getContentType();
        if (!contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must be an image");
        }

        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        // Create folder: uploads/avatars
        Path avatarsDir = Paths.get(uploadDir, "avatars").toAbsolutePath().normalize();
        Files.createDirectories(avatarsDir);

        // File name: user_{id}.png (overwrite)
        String ext = contentType.contains("png") ? "png"
                : (contentType.contains("jpeg") || contentType.contains("jpg")) ? "jpg"
                : "img";
        String fileName = "user_" + ua.getUserId() + "." + ext;

        Path target = avatarsDir.resolve(fileName).normalize();
        if (!target.startsWith(avatarsDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
        }

        // Delete old avatar file if it was local and has a different filename
        String oldUrl = ua.getAvatarUrl();
        if (oldUrl != null && oldUrl.startsWith("/uploads/avatars/")) {
            String oldFile = oldUrl.substring("/uploads/avatars/".length());
            Path oldPath = avatarsDir.resolve(oldFile).normalize();
            if (oldPath.startsWith(avatarsDir) && Files.exists(oldPath) && !oldPath.equals(target)) {
                Files.delete(oldPath);
            }
        }

        Files.copy(avatar.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String publicUrl = "/uploads/avatars/" + fileName;
        ua.setAvatarUrl(publicUrl);
        userAccountRepo.save(ua);

        return Map.of("avatarUrl", publicUrl);
    }

    @DeleteMapping("/avatar")
    public Map<String, Boolean> deleteAvatar(Principal principal) throws IOException {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(principal.getName())
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
}
