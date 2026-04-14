package com.example.backend.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalFileStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void storeIncidentImages_savesValidFilesAndReturnsPublicUrls() {
        LocalFileStorageService service = new LocalFileStorageService(tempDir.toString());

        MockMultipartFile first = new MockMultipartFile(
            "files",
            "a.png",
            "image/png",
            new byte[] { 1, 2, 3, 4 }
        );
        MockMultipartFile second = new MockMultipartFile(
            "files",
            "b.jpg",
            "image/jpeg",
            new byte[] { 5, 6, 7, 8 }
        );

        List<String> urls = service.storeIncidentImages(new MockMultipartFile[] { first, second });

        assertEquals(2, urls.size());
        assertTrue(urls.get(0).startsWith("/uploads/"));
        assertTrue(Files.exists(tempDir.resolve(urls.get(0).replace("/uploads/", "")).normalize()));
    }

    @Test
    void storeIncidentImages_rejectsUnsupportedFileType() {
        LocalFileStorageService service = new LocalFileStorageService(tempDir.toString());

        MockMultipartFile invalid = new MockMultipartFile(
            "files",
            "payload.txt",
            "text/plain",
            "oops".getBytes()
        );

        ResponseStatusException ex = assertThrows(
            ResponseStatusException.class,
            () -> service.storeIncidentImages(new MockMultipartFile[] { invalid })
        );

        assertTrue(ex.getReason().contains("Only JPG, PNG, and WEBP"));
    }
}
