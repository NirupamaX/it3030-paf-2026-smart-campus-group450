package com.example.backend.controller;

import com.example.backend.dto.BookingDecisionRequest;
import com.example.backend.dto.BookingRequest;
import com.example.backend.dto.ViewMapper;
import com.example.backend.service.BookingService;
import com.example.backend.service.CurrentUserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final CurrentUserService currentUserService;

    public BookingController(BookingService bookingService, CurrentUserService currentUserService) {
        this.bookingService = bookingService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public Map<String, Object> create(@Valid @RequestBody BookingRequest request) {
        return ViewMapper.booking(bookingService.create(request, currentUserService.getCurrentUser()));
    }

    @GetMapping("/mine")
    public List<Map<String, Object>> mine() {
        return bookingService
            .listMine(currentUserService.getCurrentUser())
            .stream()
            .map(ViewMapper::booking)
            .toList();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> all() {
        return bookingService.listAll().stream().map(ViewMapper::booking).toList();
    }

    @PatchMapping("/{id}/decision")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> decide(@PathVariable Long id, @Valid @RequestBody BookingDecisionRequest request) {
        return ViewMapper.booking(bookingService.decide(id, request, currentUserService.getCurrentUser()));
    }

    @PatchMapping("/{id}/cancel")
    public Map<String, Object> cancel(@PathVariable Long id) {
        return ViewMapper.booking(bookingService.cancel(id, currentUserService.getCurrentUser()));
    }
}
