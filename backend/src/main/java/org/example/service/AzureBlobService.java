package org.example.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobContainerClientBuilder;
import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;

@Service
public class AzureBlobService {

    @Value("${AZURE_STORAGE_CONNECTION_STRING}")
    private String connectionString;

    @Value("${AZURE_STORAGE_CONTAINER}")
    private String containerName;

    @Value("${AZURE_STORAGE_DEFAULT_AVATAR_URL:https://teleconnectstorage123.blob.core.windows.net/avatars/default.jpg}")
    private String defaultAvatarUrl;

    private final UserAccountRepository userAccountRepo;

    public AzureBlobService(UserAccountRepository userAccountRepo) {
        this.userAccountRepo = userAccountRepo;
    }

    private BlobContainerClient getContainerClient() {
        return new BlobContainerClientBuilder()
                .connectionString(connectionString)
                .containerName(containerName)
                .buildClient();
    }

    public String saveUploadedAvatar(UserAccount ua, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File is empty");
        }

        // delete old custom avatar first, but do not delete the default image
        deleteExistingCustomAvatar(ua);

        BlobContainerClient containerClient = getContainerClient();

        String originalName = file.getOriginalFilename() == null ? "avatar.jpg" : file.getOriginalFilename();
        String fileName = UUID.randomUUID() + "_" + originalName;

        BlobClient blobClient = containerClient.getBlobClient(fileName);
        blobClient.upload(file.getInputStream(), file.getSize(), true);

        String publicUrl = blobClient.getBlobUrl();

        ua.setAvatarUrl(publicUrl);
        userAccountRepo.save(ua);

        return publicUrl;
    }

    public void deleteAvatar(UserAccount ua) {
        deleteExistingCustomAvatar(ua);

        // fallback to default blob image instead of old local path
        ua.setAvatarUrl(defaultAvatarUrl);
        userAccountRepo.save(ua);
    }

    private void deleteExistingCustomAvatar(UserAccount ua) {
        String avatarUrl = ua.getAvatarUrl();

        if (avatarUrl == null || avatarUrl.isBlank()) {
            return;
        }

        // do not delete the shared default avatar
        if (avatarUrl.equals(defaultAvatarUrl)) {
            return;
        }

        try {
            URI uri = URI.create(avatarUrl);
            String path = uri.getPath(); // /avatars/filename.jpg

            String prefix = "/" + containerName + "/";
            if (!path.startsWith(prefix)) {
                return;
            }

            String blobName = path.substring(prefix.length());
            if (blobName.isBlank()) {
                return;
            }

            BlobClient blobClient = getContainerClient().getBlobClient(blobName);
            if (blobClient.exists()) {
                blobClient.delete();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete blob: " + e.getMessage(), e);
        }
    }
}