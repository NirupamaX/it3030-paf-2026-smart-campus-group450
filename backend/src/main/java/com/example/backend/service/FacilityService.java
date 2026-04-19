package com.example.backend.service;

import com.example.backend.dto.FacilityRequest;
import com.example.backend.model.Facility;
import com.example.backend.repository.FacilityRepository;
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
        Facility facility = new Facility();
        apply(facility, request);
        return facilityRepository.save(facility);
    }

    public Facility update(Long id, FacilityRequest request) {
        Facility facility = getById(id);
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
        Integer capacityMax,
        Boolean availableOnly
    ) {
        if (capacityMin != null && capacityMax != null && capacityMin > capacityMax) {
            throw new ResponseStatusException(BAD_REQUEST, "capacityMin cannot be greater than capacityMax");
        }

        String normalizedQuery = normalize(q);
        String normalizedType = normalize(type);
        String normalizedLocation = normalize(location);

        return facilityRepository
            .findAll()
            .stream()
            .filter(facility -> !Boolean.TRUE.equals(availableOnly) || facility.isAvailable())
            .filter(facility ->
                normalizedQuery == null ||
                containsIgnoreCase(facility.getName(), normalizedQuery) ||
                containsIgnoreCase(facility.getType(), normalizedQuery) ||
                containsIgnoreCase(facility.getLocation(), normalizedQuery)
            )
            .filter(facility -> normalizedType == null || containsIgnoreCase(facility.getType(), normalizedType))
            .filter(facility ->
                normalizedLocation == null ||
                containsIgnoreCase(facility.getLocation(), normalizedLocation)
            )
            .filter(facility -> capacityMin == null || facility.getCapacity() >= capacityMin)
            .filter(facility -> capacityMax == null || facility.getCapacity() <= capacityMax)
            .toList();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private boolean containsIgnoreCase(String source, String target) {
        if (source == null || target == null) {
            return false;
        }
        return source.toLowerCase(Locale.ROOT).contains(target);
    }

    private void apply(Facility facility, FacilityRequest request) {
        facility.setName(request.getName());
        facility.setType(request.getType());
        facility.setLocation(request.getLocation());
        facility.setCapacity(request.getCapacity());
        facility.setDescription(request.getDescription());
        facility.setAvailable(Boolean.TRUE.equals(request.getAvailable()));
        facility.setStatus(request.getStatus());
        facility.setOperatingHours(request.getOperatingHours());
        facility.setOpeningTime(request.getOpeningTime());
        facility.setClosingTime(request.getClosingTime());
    }

}

