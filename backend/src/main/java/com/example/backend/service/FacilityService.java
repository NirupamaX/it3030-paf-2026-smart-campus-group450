package com.example.backend.service;

import com.example.backend.dto.FacilityRequest;
import com.example.backend.model.Facility;
import com.example.backend.repository.FacilityRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
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

    public List<Facility> list(String q, String type) {
        if (q != null && !q.isBlank()) {
            return facilityRepository.findByNameContainingIgnoreCaseOrTypeContainingIgnoreCaseOrLocationContainingIgnoreCase(
                q,
                q,
                q
            );
        }
        if (type != null && !type.isBlank()) {
            return facilityRepository.findByTypeIgnoreCase(type);
        }
        return facilityRepository.findAll();
    }

    private void apply(Facility facility, FacilityRequest request) {
        facility.setName(request.getName());
        facility.setType(request.getType());
        facility.setLocation(request.getLocation());
        facility.setCapacity(request.getCapacity());
        facility.setDescription(request.getDescription());
        facility.setAvailable(Boolean.TRUE.equals(request.getAvailable()));
        facility.setStatus(request.getStatus());
        facility.setOpeningTime(request.getOpeningTime());
        facility.setClosingTime(request.getClosingTime());
    }
}
