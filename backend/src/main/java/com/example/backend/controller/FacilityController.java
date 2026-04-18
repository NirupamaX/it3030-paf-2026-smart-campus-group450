package com.example.backend.controller;

import com.example.backend.dto.FacilityRequest;
import com.example.backend.dto.ViewMapper;
import com.example.backend.service.FacilityService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
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
@RequestMapping({ "/api/v1/facilities", "/api/facilities" })
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping
    public List<Map<String, Object>> list(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String location,
        @RequestParam(required = false) Integer capacityMin,
        @RequestParam(required = false) Integer capacityMax
    ) {
        return facilityService
            .list(q, type, location, capacityMin, capacityMax)
            .stream()
            .map(ViewMapper::facility)
            .toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> create(@Valid @RequestBody FacilityRequest request) {
        return ViewMapper.facility(facilityService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> update(@PathVariable Long id, @Valid @RequestBody FacilityRequest request) {
        return ViewMapper.facility(facilityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        facilityService.delete(id);
    }
}

