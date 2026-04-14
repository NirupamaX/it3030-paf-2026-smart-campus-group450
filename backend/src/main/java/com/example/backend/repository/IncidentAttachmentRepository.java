package com.example.backend.repository;

import com.example.backend.model.IncidentAttachment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentAttachmentRepository extends JpaRepository<IncidentAttachment, Long> {
    List<IncidentAttachment> findByIncidentIdOrderByCreatedAtAsc(Long incidentId);

    long countByIncidentId(Long incidentId);
}
