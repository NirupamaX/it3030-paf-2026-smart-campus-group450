package com.example.backend.controller;

import com.example.backend.dto.BookingDecisionRequest;
import com.example.backend.dto.BookingRequest;
import com.example.backend.dto.ViewMapper;
import com.example.backend.model.BookingStatus;
import com.example.backend.service.BookingService;
import com.example.backend.service.CurrentUserService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping({ "/api/v1/bookings", "/api/bookings" })
public class BookingController {

    private final BookingService bookingService;
    private final CurrentUserService currentUserService;

    public BookingController(BookingService bookingService, CurrentUserService currentUserService) {
        this.bookingService = bookingService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody BookingRequest request) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ViewMapper.booking(bookingService.create(request, currentUserService.getCurrentUser())));
    }

    @GetMapping("/user/{userId}")
    public List<Map<String, Object>> getByUser(@PathVariable Long userId) {
        return bookingService
            .listByUserId(userId, currentUserService.getCurrentUser())
            .stream()
            .map(ViewMapper::booking)
            .toList();
    }

    @GetMapping("/mine")
    public List<Map<String, Object>> mine() {
        Long currentUserId = currentUserService.getCurrentUser().getId();
        return bookingService
            .listByUserId(currentUserId, currentUserService.getCurrentUser())
            .stream()
            .map(ViewMapper::booking)
            .toList();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> all(
        @RequestParam(required = false) BookingStatus status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bookingDate
    ) {
        return bookingService.listAll(status, bookingDate).stream().map(ViewMapper::booking).toList();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> updateStatusPut(@PathVariable Long id, @Valid @RequestBody BookingDecisionRequest request) {
        return ViewMapper.booking(bookingService.updateStatus(id, request, currentUserService.getCurrentUser()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> updateStatusPatch(@PathVariable Long id, @Valid @RequestBody BookingDecisionRequest request) {
        return ViewMapper.booking(bookingService.updateStatus(id, request, currentUserService.getCurrentUser()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        bookingService.cancel(id, currentUserService.getCurrentUser());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/decision")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> decideLegacy(@PathVariable Long id, @Valid @RequestBody BookingDecisionRequest request) {
        return ViewMapper.booking(bookingService.updateStatus(id, request, currentUserService.getCurrentUser()));
    }

    @PatchMapping("/{id}/cancel")
    public Map<String, Object> cancelLegacy(@PathVariable Long id) {
        return ViewMapper.booking(bookingService.cancel(id, currentUserService.getCurrentUser()));
    }
}
