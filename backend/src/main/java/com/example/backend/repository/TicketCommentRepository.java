package com.example.backend.repository;

import com.example.backend.model.TicketComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    List<TicketComment> findByIncidentIdOrderByCreatedAtAsc(Long incidentId);
}
