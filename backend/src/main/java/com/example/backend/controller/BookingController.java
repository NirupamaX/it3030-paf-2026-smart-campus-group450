package com.example.backend.controller;

import com.example.backend.dto.BookingDecisionRequest;
import com.example.backend.dto.BookingRequest;
import com.example.backend.dto.PagedResponse;
import com.example.backend.dto.ViewMapper;
import com.example.backend.model.BookingStatus;
import com.example.backend.service.BookingService;
import com.example.backend.service.CurrentUserService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import org.springframework.data.domain.Page;
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
    public PagedResponse getByUser(
        @PathVariable Long userId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<com.example.backend.model.Booking> result =
            bookingService.listByUserId(userId, currentUserService.getCurrentUser(), page, size);
        return PagedResponse.of(result.getContent().stream().map(ViewMapper::booking).toList(),
            page, size, result.getTotalElements());
    }

    @GetMapping("/mine")
    public PagedResponse mine(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Long currentUserId = currentUserService.getCurrentUser().getId();
        Page<com.example.backend.model.Booking> result =
            bookingService.listByUserId(currentUserId, currentUserService.getCurrentUser(), page, size);
        return PagedResponse.of(result.getContent().stream().map(ViewMapper::booking).toList(),
            page, size, result.getTotalElements());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PagedResponse all(
        @RequestParam(required = false) BookingStatus status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bookingDate,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<com.example.backend.model.Booking> result = bookingService.listAll(status, bookingDate, page, size);
        return PagedResponse.of(result.getContent().stream().map(ViewMapper::booking).toList(),
            page, size, result.getTotalElements());
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

    @GetMapping("/availability")
    public Map<String, Object> checkAvailability(
        @RequestParam Long resourceId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bookingDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime
    ) {
        boolean available = bookingService.isSlotAvailable(resourceId, bookingDate, startTime, endTime);
        return Map.of(
            "available",
            available,
            "message",
            available ? "Time slot is available" : "Time slot is not available"
        );
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

