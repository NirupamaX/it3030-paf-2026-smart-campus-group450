package com.example.backend.service;

import com.example.backend.dto.IncidentAssignRequest;
import com.example.backend.dto.IncidentCommentCreateRequest;
import com.example.backend.dto.IncidentCommentUpdateRequest;
import com.example.backend.dto.IncidentCreateRequest;
import com.example.backend.dto.IncidentUpdateRequest;
import com.example.backend.model.IncidentAttachment;
import com.example.backend.model.IncidentStatus;
import com.example.backend.model.IncidentTicket;
import com.example.backend.model.NotificationType;
import com.example.backend.model.Role;
import com.example.backend.model.TicketComment;
import com.example.backend.model.User;
import com.example.backend.repository.IncidentAttachmentRepository;
import com.example.backend.repository.IncidentTicketRepository;
import com.example.backend.repository.TicketCommentRepository;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class IncidentService {

    private final IncidentTicketRepository incidentRepository;
    private final IncidentAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public IncidentService(
        IncidentTicketRepository incidentRepository,
        IncidentAttachmentRepository attachmentRepository,
        TicketCommentRepository commentRepository,
        UserService userService,
        NotificationService notificationService
    ) {
        this.incidentRepository = incidentRepository;
        this.attachmentRepository = attachmentRepository;
        this.commentRepository = commentRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public IncidentTicket create(IncidentCreateRequest request, User reporter) {
        IncidentTicket ticket = new IncidentTicket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setLocation(request.getLocation());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(request.getPriority());
        ticket.setStatus(IncidentStatus.OPEN);
        ticket.setReporter(reporter);
        ticket.setPreferredContact(request.getPreferredContact());

        List<String> imageUrls = normalizedImageUrls(request);
        if (!imageUrls.isEmpty()) {
            ticket.setImageUrl(imageUrls.get(0));
        }

        IncidentTicket saved = incidentRepository.save(ticket);

        if (!imageUrls.isEmpty()) {
            List<IncidentAttachment> attachments = new ArrayList<>();
            for (String url : imageUrls) {
                IncidentAttachment attachment = new IncidentAttachment();
                attachment.setIncident(saved);
                attachment.setFileUrl(url);
                attachments.add(attachment);
            }
            attachmentRepository.saveAll(attachments);
        }

        notificationService.create(
            reporter,
            NotificationType.INCIDENT,
            "Incident ticket #" + saved.getId() + " was created successfully."
        );
        return saved;
    }

    public List<IncidentTicket> listAll() {
        return incidentRepository.findAllByOrderByUpdatedAtDesc();
    }

    public List<IncidentTicket> listMyReported(User user) {
        return incidentRepository.findByReporterIdOrderByCreatedAtDesc(user.getId());
    }

    public List<IncidentTicket> listAssignedTo(User technician) {
        return incidentRepository.findByTechnicianIdOrderByUpdatedAtDesc(technician.getId());
    }

    @Transactional
    public IncidentTicket assign(Long incidentId, IncidentAssignRequest request, User actor) {
        IncidentTicket ticket = getById(incidentId);
        User technician = userService.getById(request.getTechnicianId());

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new ResponseStatusException(BAD_REQUEST, "Selected user is not a technician");
        }

        ticket.setTechnician(technician);
        ticket.setStatus(IncidentStatus.IN_PROGRESS);

        notificationService.create(
            technician,
            NotificationType.INCIDENT,
            "You were assigned to incident #" + ticket.getId() + " by " + actor.getFullName() + "."
        );
        notificationService.create(
            ticket.getReporter(),
            NotificationType.INCIDENT,
            "Incident #" + ticket.getId() + " was assigned to " + technician.getFullName() + "."
        );

        return ticket;
    }

    @Transactional
    public IncidentTicket updateStatus(Long incidentId, IncidentUpdateRequest request, User actor) {
        IncidentTicket ticket = getById(incidentId);

        if (
            actor.getRole() == Role.TECHNICIAN &&
            (ticket.getTechnician() == null || !ticket.getTechnician().getId().equals(actor.getId()))
        ) {
            throw new ResponseStatusException(FORBIDDEN, "You can update only incidents assigned to you");
        }

        ticket.setStatus(request.getStatus());
        if (request.getResolutionNote() != null && !request.getResolutionNote().isBlank()) {
            ticket.setResolutionNote(request.getResolutionNote());
        }
        if (request.getStatus() == IncidentStatus.REJECTED) {
            if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                throw new ResponseStatusException(BAD_REQUEST, "Rejection reason is required when rejecting an incident");
            }
            ticket.setRejectionReason(request.getRejectionReason().trim());
        }

        notificationService.create(
            ticket.getReporter(),
            NotificationType.INCIDENT,
            "Incident #" + ticket.getId() + " status changed to " + request.getStatus().name() + "."
        );

        if (ticket.getTechnician() != null && !ticket.getTechnician().getId().equals(ticket.getReporter().getId())) {
            notificationService.create(
                ticket.getTechnician(),
                NotificationType.INCIDENT,
                "Incident #" + ticket.getId() + " updated by " + actor.getFullName() + "."
            );
        }

        return ticket;
    }

    public List<IncidentAttachment> listAttachments(Long incidentId, User actor) {
        IncidentTicket ticket = getById(incidentId);
        ensureIncidentAccess(ticket, actor);
        return attachmentRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId);
    }

    public List<TicketComment> listComments(Long incidentId, User actor) {
        IncidentTicket ticket = getById(incidentId);
        ensureIncidentAccess(ticket, actor);
        return commentRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId);
    }

    @Transactional
    public TicketComment addComment(Long incidentId, IncidentCommentCreateRequest request, User actor) {
        IncidentTicket ticket = getById(incidentId);
        ensureIncidentAccess(ticket, actor);

        TicketComment comment = new TicketComment();
        comment.setIncident(ticket);
        comment.setAuthor(actor);
        comment.setContent(request.getContent().trim());

        TicketComment saved = commentRepository.save(comment);
        notifyCommentParticipants(ticket, actor);
        return saved;
    }

    @Transactional
    public TicketComment updateComment(
        Long incidentId,
        Long commentId,
        IncidentCommentUpdateRequest request,
        User actor
    ) {
        IncidentTicket ticket = getById(incidentId);
        ensureIncidentAccess(ticket, actor);

        TicketComment comment = getCommentById(commentId);
        if (!comment.getIncident().getId().equals(ticket.getId())) {
            throw new ResponseStatusException(NOT_FOUND, "Comment not found");
        }
        if (!comment.getAuthor().getId().equals(actor.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only edit your own comments");
        }

        comment.setContent(request.getContent().trim());
        return comment;
    }

    @Transactional
    public void deleteComment(Long incidentId, Long commentId, User actor) {
        IncidentTicket ticket = getById(incidentId);
        ensureIncidentAccess(ticket, actor);

        TicketComment comment = getCommentById(commentId);
        if (!comment.getIncident().getId().equals(ticket.getId())) {
            throw new ResponseStatusException(NOT_FOUND, "Comment not found");
        }
        if (!comment.getAuthor().getId().equals(actor.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    private void ensureIncidentAccess(IncidentTicket ticket, User actor) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }

        boolean isReporter = ticket.getReporter() != null && ticket.getReporter().getId().equals(actor.getId());
        boolean isAssignedTech = ticket.getTechnician() != null && ticket.getTechnician().getId().equals(actor.getId());

        if (!isReporter && !isAssignedTech) {
            throw new ResponseStatusException(FORBIDDEN, "You are not allowed to access this incident");
        }
    }

    private TicketComment getCommentById(Long commentId) {
        return commentRepository
            .findById(commentId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Comment not found"));
    }

    private List<String> normalizedImageUrls(IncidentCreateRequest request) {
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<String> urls = request
                .getImageUrls()
                .stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .limit(3)
                .toList();
            return urls.isEmpty() ? Collections.emptyList() : urls;
        }

        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            return List.of(request.getImageUrl().trim());
        }

        return Collections.emptyList();
    }

    private void notifyCommentParticipants(IncidentTicket ticket, User actor) {
        if (!ticket.getReporter().getId().equals(actor.getId())) {
            notificationService.create(
                ticket.getReporter(),
                NotificationType.INCIDENT,
                "New comment on incident #" + ticket.getId() + " by " + actor.getFullName() + "."
            );
        }

        if (
            ticket.getTechnician() != null &&
            !ticket.getTechnician().getId().equals(actor.getId()) &&
            !ticket.getTechnician().getId().equals(ticket.getReporter().getId())
        ) {
            notificationService.create(
                ticket.getTechnician(),
                NotificationType.INCIDENT,
                "New comment on incident #" + ticket.getId() + " by " + actor.getFullName() + "."
            );
        }
    }

    private IncidentTicket getById(Long id) {
        return incidentRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Incident not found"));
    }
}
