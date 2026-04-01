package com.example.backend.repository;

import com.example.backend.model.IncidentStatus;
import com.example.backend.model.IncidentTicket;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {
    @Override
    @EntityGraph(attributePaths = {"reporter", "technician"})
    Optional<IncidentTicket> findById(Long id);

    @EntityGraph(attributePaths = {"reporter", "technician"})
    List<IncidentTicket> findByReporterIdOrderByCreatedAtDesc(Long reporterId);

    @EntityGraph(attributePaths = {"reporter", "technician"})
    List<IncidentTicket> findByTechnicianIdOrderByUpdatedAtDesc(Long technicianId);

    @EntityGraph(attributePaths = {"reporter", "technician"})
    List<IncidentTicket> findByStatusOrderByUpdatedAtDesc(IncidentStatus status);

    @EntityGraph(attributePaths = {"reporter", "technician"})
    List<IncidentTicket> findAllByOrderByUpdatedAtDesc();
}
