package com.example.backend.controller;

import com.example.backend.dto.FacilityRequest;
import com.example.backend.dto.ViewMapper;
import com.example.backend.service.FacilityService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String location,
        @RequestParam(required = false) Integer capacityMin,
        @RequestParam(required = false) Integer capacityMax
    ) {
        List<Map<String, Object>> facilities = facilityService
            .list(q, type, location, capacityMin, capacityMax)
            .stream()
            .map(ViewMapper::facility)
            .toList();

        return ResponseEntity.ok(facilities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ViewMapper.facility(facilityService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody FacilityRequest request) {
        return ResponseEntity
            .status(201)
            .body(ViewMapper.facility(facilityService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> update(
        @PathVariable Long id,
        @Valid @RequestBody FacilityRequest request
    ) {
        return ResponseEntity.ok(ViewMapper.facility(facilityService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        facilityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}