package com.example.backend.controller;

import com.example.backend.dto.IncidentAssignRequest;
import com.example.backend.dto.IncidentCommentCreateRequest;
import com.example.backend.dto.IncidentCommentUpdateRequest;
import com.example.backend.dto.IncidentCreateRequest;
import com.example.backend.dto.IncidentUpdateRequest;
import com.example.backend.dto.ViewMapper;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.service.CurrentUserService;
import com.example.backend.service.IncidentService;
import com.example.backend.service.LocalFileStorageService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;
    private final CurrentUserService currentUserService;
    private final LocalFileStorageService localFileStorageService;

    public IncidentController(
        IncidentService incidentService,
        CurrentUserService currentUserService,
        LocalFileStorageService localFileStorageService
    ) {
        this.incidentService = incidentService;
        this.currentUserService = currentUserService;
        this.localFileStorageService = localFileStorageService;
    }

    @PostMapping
    public Map<String, Object> create(@Valid @RequestBody IncidentCreateRequest request) {
        return ViewMapper.incident(incidentService.create(request, currentUserService.getCurrentUser()));
    }

    @PostMapping("/uploads")
    public Map<String, Object> uploadImages(@RequestParam("files") MultipartFile[] files) {
        return Map.of("files", localFileStorageService.storeIncidentImages(files));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public List<Map<String, Object>> listAll() {
        return incidentService.listAll().stream().map(ViewMapper::incident).toList();
    }

    @GetMapping("/mine")
    public List<Map<String, Object>> myReported() {
        return incidentService
            .listMyReported(currentUserService.getCurrentUser())
            .stream()
            .map(ViewMapper::incident)
            .toList();
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public List<Map<String, Object>> assigned() {
        User current = currentUserService.getCurrentUser();
        if (current.getRole() == Role.ADMIN) {
            return incidentService.listAll().stream().map(ViewMapper::incident).toList();
        }

        return incidentService.listAssignedTo(current).stream().map(ViewMapper::incident).toList();
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> assign(@PathVariable Long id, @Valid @RequestBody IncidentAssignRequest request) {
        return ViewMapper.incident(incidentService.assign(id, request, currentUserService.getCurrentUser()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public Map<String, Object> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody IncidentUpdateRequest request
    ) {
        return ViewMapper.incident(
            incidentService.updateStatus(id, request, currentUserService.getCurrentUser())
        );
    }

    @GetMapping("/{id}/attachments")
    public List<Map<String, Object>> attachments(@PathVariable Long id) {
        return incidentService
            .listAttachments(id, currentUserService.getCurrentUser())
            .stream()
            .map(ViewMapper::incidentAttachment)
            .toList();
    }

    @GetMapping("/{id}/comments")
    public List<Map<String, Object>> comments(@PathVariable Long id) {
        return incidentService
            .listComments(id, currentUserService.getCurrentUser())
            .stream()
            .map(ViewMapper::ticketComment)
            .toList();
    }

    @PostMapping("/{id}/comments")
    public Map<String, Object> addComment(
        @PathVariable Long id,
        @Valid @RequestBody IncidentCommentCreateRequest request
    ) {
        return ViewMapper.ticketComment(
            incidentService.addComment(id, request, currentUserService.getCurrentUser())
        );
    }

    @PutMapping("/{id}/comments/{commentId}")
    public Map<String, Object> updateComment(
        @PathVariable Long id,
        @PathVariable Long commentId,
        @Valid @RequestBody IncidentCommentUpdateRequest request
    ) {
        return ViewMapper.ticketComment(
            incidentService.updateComment(id, commentId, request, currentUserService.getCurrentUser())
        );
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public void deleteComment(@PathVariable Long id, @PathVariable Long commentId) {
        incidentService.deleteComment(id, commentId, currentUserService.getCurrentUser());
    }
}
