package com.example.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
public class LocalFileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final Path rootUploadDir;

    public LocalFileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.rootUploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public List<String> storeIncidentImages(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new ResponseStatusException(BAD_REQUEST, "At least one image file is required");
        }
        if (files.length > 3) {
            throw new ResponseStatusException(BAD_REQUEST, "You can upload up to 3 images per request");
        }

        Path incidentDir = rootUploadDir.resolve("incidents").resolve(LocalDate.now().toString()).normalize();
        ensureDirectory(incidentDir);

        return java.util.Arrays.stream(files).map(file -> storeOneFile(file, incidentDir)).toList();
    }

    private String storeOneFile(MultipartFile file, Path targetDir) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Empty file uploads are not allowed");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(BAD_REQUEST, "Only JPG, PNG, and WEBP image files are allowed");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ResponseStatusException(BAD_REQUEST, "Each image must be 5MB or smaller");
        }

        String extension = switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> "";
        };

        String filename = UUID.randomUUID() + extension;
        Path destination = targetDir.resolve(filename).normalize();

        if (!destination.startsWith(rootUploadDir)) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid upload target path");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
            String relativePath = rootUploadDir.relativize(destination).toString().replace("\\", "/");
            return "/uploads/" + relativePath;
        } catch (IOException exception) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Failed to store uploaded image");
        }
    }

    private void ensureDirectory(Path dir) {
        try {
            Files.createDirectories(dir);
        } catch (IOException exception) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Failed to prepare upload directory");
        }
    }
}
