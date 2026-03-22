package com.example.backend.repository;

import com.example.backend.model.IncidentStatus;
import com.example.backend.model.IncidentTicket;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {
    List<IncidentTicket> findByReporterIdOrderByCreatedAtDesc(Long reporterId);

    List<IncidentTicket> findByTechnicianIdOrderByUpdatedAtDesc(Long technicianId);

    List<IncidentTicket> findByStatusOrderByUpdatedAtDesc(IncidentStatus status);

    List<IncidentTicket> findAllByOrderByUpdatedAtDesc();
}
