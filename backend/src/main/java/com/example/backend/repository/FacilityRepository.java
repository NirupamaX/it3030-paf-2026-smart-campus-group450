package com.example.backend.repository;

import com.example.backend.model.Facility;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility, Long> {
    List<Facility> findByNameContainingIgnoreCaseOrTypeContainingIgnoreCaseOrLocationContainingIgnoreCase(
        String name,
        String type,
        String location
    );

    List<Facility> findByTypeIgnoreCase(String type);
    
    List<Facility> findByAvailableTrue();
    
    List<Facility> findByAvailableTrueOrderByNameAsc();
}


