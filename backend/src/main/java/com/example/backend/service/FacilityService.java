package com.example.backend.service;

import com.example.backend.dto.FacilityRequest;
import com.example.backend.model.Facility;
import com.example.backend.repository.FacilityRepository;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;

    public FacilityService(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    public Facility create(FacilityRequest request) {
        validateRequest(request);

        if (facilityRepository.existsByNameIgnoreCaseAndLocationIgnoreCase(
            request.getName().trim(),
            request.getLocation().trim()
        )) {
            throw new ResponseStatusException(BAD_REQUEST, "Facility already exists in this location");
        }

        Facility facility = new Facility();
        apply(facility, request);
        return facilityRepository.save(facility);
    }

    public Facility update(Long id, FacilityRequest request) {
        validateRequest(request);

        Facility facility = getById(id);

        if (facilityRepository.existsByNameIgnoreCaseAndLocationIgnoreCaseAndIdNot(
            request.getName().trim(),
            request.getLocation().trim(),
            id
        )) {
            throw new ResponseStatusException(BAD_REQUEST, "Another facility already exists in this location");
        }

        apply(facility, request);
        return facilityRepository.save(facility);
    }

    public void delete(Long id) {
        facilityRepository.delete(getById(id));
    }

    public Facility getById(Long id) {
        return facilityRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Facility not found"));
    }

    public List<Facility> list(
        String q,
        String type,
        String location,
        Integer capacityMin,
        Integer capacityMax
    ) {
        if (capacityMin != null && capacityMin < 1) {
            throw new ResponseStatusException(BAD_REQUEST, "capacityMin must be greater than 0");
        }

        if (capacityMax != null && capacityMax < 1) {
            throw new ResponseStatusException(BAD_REQUEST, "capacityMax must be greater than 0");
        }

        if (capacityMin != null && capacityMax != null && capacityMin > capacityMax) {
            throw new ResponseStatusException(BAD_REQUEST, "capacityMin cannot be greater than capacityMax");
        }

        String normalizedQuery = normalize(q);
        String normalizedType = normalize(type);
        String normalizedLocation = normalize(location);

        return facilityRepository
            .findAll()
            .stream()
            .filter(facility ->
                normalizedQuery == null ||
                containsIgnoreCase(facility.getName(), normalizedQuery) ||
                containsIgnoreCase(facility.getType(), normalizedQuery) ||
                containsIgnoreCase(facility.getLocation(), normalizedQuery)
            )
            .filter(facility ->
                normalizedType == null || containsIgnoreCase(facility.getType(), normalizedType)
            )
            .filter(facility ->
                normalizedLocation == null || containsIgnoreCase(facility.getLocation(), normalizedLocation)
            )
            .filter(facility -> capacityMin == null || facility.getCapacity() >= capacityMin)
            .filter(facility -> capacityMax == null || facility.getCapacity() <= capacityMax)
            .toList();
    }

    private void validateRequest(FacilityRequest request) {
        if (request.getCapacity() == null || request.getCapacity() <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Capacity must be greater than 0");
        }

        String openingTime = safeTrim(request.getOpeningTime());
        String closingTime = safeTrim(request.getClosingTime());

        if (openingTime == null || closingTime == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Opening time and closing time are required");
        }

        LocalTime openTime = parseFlexibleTime(openingTime);
        LocalTime closeTime = parseFlexibleTime(closingTime);

        if (!openTime.isBefore(closeTime)) {
            throw new ResponseStatusException(BAD_REQUEST, "Opening time must be before closing time");
        }

        String name = safeTrim(request.getName());
        String typeValue = safeTrim(request.getType());
        String locationValue = safeTrim(request.getLocation());

        if (name == null || typeValue == null || locationValue == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Name, type, and location are required");
        }
    }

    private void apply(Facility facility, FacilityRequest request) {
        String name = request.getName().trim();
        String type = request.getType().trim();
        String location = request.getLocation().trim();
        String openingTime = normalizeTime(request.getOpeningTime().trim());
        String closingTime = normalizeTime(request.getClosingTime().trim());

        facility.setName(name);
        facility.setType(type);
        facility.setLocation(location);
        facility.setCapacity(request.getCapacity());
        facility.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        facility.setAvailable(Boolean.TRUE.equals(request.getAvailable()));
        facility.setStatus(request.getStatus());
        facility.setOpeningTime(openingTime);
        facility.setClosingTime(closingTime);
        facility.setOperatingHours(openingTime + "-" + closingTime);
    }

    private LocalTime parseFlexibleTime(String value) {
        try {
            return LocalTime.parse(value, DateTimeFormatter.ofPattern("HH:mm"));
        } catch (DateTimeParseException e) {
            try {
                return LocalTime.parse(value.toUpperCase(Locale.ROOT), DateTimeFormatter.ofPattern("hh:mm a"));
            } catch (DateTimeParseException ex) {
                throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Invalid time format. Use HH:mm or hh:mm AM/PM"
                );
            }
        }
    }

    private String normalizeTime(String value) {
        LocalTime parsed = parseFlexibleTime(value);
        return parsed.format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private String safeTrim(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean containsIgnoreCase(String source, String target) {
        if (source == null || target == null) {
            return false;
        }

        return source.toLowerCase(Locale.ROOT).contains(target);
    }
}