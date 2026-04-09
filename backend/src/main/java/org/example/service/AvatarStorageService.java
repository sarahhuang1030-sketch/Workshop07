//this is for OAuth User

package org.example.service;

import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class AvatarStorageService {

    @Value("${app.upload-dir}")
    private String uploadDir;

    private final UserAccountRepository userAccountRepo;

    public AvatarStorageService(UserAccountRepository userAccountRepo) {
        this.userAccountRepo = userAccountRepo;
    }

    public String saveUploadedAvatar(UserAccount ua, MultipartFile avatar) throws IOException {
        if (ua == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found");
        }
        if (avatar == null || avatar.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }

        String contentType = avatar.getContentType() == null ? "" : avatar.getContentType().toLowerCase();
        if (!contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must be an image");
        }

        Path avatarsDir = getAvatarsDir();

        String originalFilename = avatar.getOriginalFilename() == null
                ? ""
                : avatar.getOriginalFilename().toLowerCase();

        String ext;
        if (contentType.contains("png") || originalFilename.endsWith(".png")) {
            ext = "png";
        } else if (contentType.contains("jpeg")
                || contentType.contains("jpg")
                || originalFilename.endsWith(".jpg")
                || originalFilename.endsWith(".jpeg")) {
            ext = "jpg";
        } else if (contentType.contains("gif") || originalFilename.endsWith(".gif")) {
            ext = "gif";
        } else {
            ext = "jpg";
        }

        String fileName = "user_" + ua.getUserId() + "." + ext;
        Path target = avatarsDir.resolve(fileName).normalize();

        validateInsideDir(target, avatarsDir);
        deleteOldAvatarIfDifferent(ua, target, avatarsDir);

        try (InputStream in = avatar.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }

        String publicUrl = "/uploads/avatars/" + fileName;
        ua.setAvatarUrl(publicUrl);
        userAccountRepo.save(ua);

        return publicUrl;
    }

    public boolean deleteAvatar(UserAccount ua) throws IOException {
        if (ua == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found");
        }

        Path avatarsDir = getAvatarsDir();

        String url = ua.getAvatarUrl();
        if (url != null && url.startsWith("/uploads/avatars/")) {
            String file = url.substring("/uploads/avatars/".length());
            Path path = avatarsDir.resolve(file).normalize();
            validateInsideDir(path, avatarsDir);

            if (Files.exists(path)) {
                Files.delete(path);
            }
        }

        ua.setAvatarUrl(null);
        userAccountRepo.save(ua);
        return true;
    }

    public String importOAuthAvatarForUser(UserAccount ua, String imageUrl, String provider) throws IOException {
        if (ua == null || imageUrl == null || imageUrl.isBlank()) {
            return null;
        }

        // Do not overwrite an existing local avatar
        if (ua.getAvatarUrl() != null && !ua.getAvatarUrl().isBlank()) {
            return ua.getAvatarUrl();
        }

        Path avatarsDir = getAvatarsDir();

        String safeProvider = (provider == null || provider.isBlank()) ? "oauth" : provider.toLowerCase();
        String fileName = "user_" + ua.getUserId() + "_" + safeProvider + ".jpg";
        Path target = avatarsDir.resolve(fileName).normalize();

        validateInsideDir(target, avatarsDir);

        try (InputStream in = new URL(imageUrl).openStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (Exception e) {
            // Fail gracefully: do not break login/profile just because avatar import failed
            return null;
        }

        String publicUrl = "/uploads/avatars/" + fileName;
        ua.setAvatarUrl(publicUrl);
        userAccountRepo.save(ua);

        return publicUrl;
    }

    private Path getAvatarsDir() throws IOException {
        Path avatarsDir = Paths.get(uploadDir, "avatars").toAbsolutePath().normalize();
        Files.createDirectories(avatarsDir);
        return avatarsDir;
    }

    private void validateInsideDir(Path target, Path baseDir) {
        if (!target.startsWith(baseDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
        }
    }

    private void deleteOldAvatarIfDifferent(UserAccount ua, Path target, Path avatarsDir) throws IOException {
        String oldUrl = ua.getAvatarUrl();
        if (oldUrl != null && oldUrl.startsWith("/uploads/avatars/")) {
            String oldFile = oldUrl.substring("/uploads/avatars/".length());
            Path oldPath = avatarsDir.resolve(oldFile).normalize();

            if (oldPath.startsWith(avatarsDir) && Files.exists(oldPath) && !oldPath.equals(target)) {
                Files.delete(oldPath);
            }
        }
    }
}
