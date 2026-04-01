package com.example.backend.repository;

import com.example.backend.model.TicketComment;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    @EntityGraph(attributePaths = {"author", "incident"})
    List<TicketComment> findByIncidentIdOrderByCreatedAtAsc(Long incidentId);
}
