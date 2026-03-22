package com.example.backend.service;

import com.example.backend.dto.BookingDecisionRequest;
import com.example.backend.dto.BookingRequest;
import com.example.backend.model.Booking;
import com.example.backend.model.BookingStatus;
import com.example.backend.model.Facility;
import com.example.backend.model.NotificationType;
import com.example.backend.model.ResourceStatus;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.BookingRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityService facilityService;
    private final NotificationService notificationService;

    public BookingService(
        BookingRepository bookingRepository,
        FacilityService facilityService,
        NotificationService notificationService
    ) {
        this.bookingRepository = bookingRepository;
        this.facilityService = facilityService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Booking create(BookingRequest request, User user) {
        if (request.getEndTime().isBefore(request.getStartTime()) || request.getEndTime().isEqual(request.getStartTime())) {
            throw new ResponseStatusException(BAD_REQUEST, "End time must be after start time");
        }

        Facility facility = facilityService.getById(request.getFacilityId());
        if (!facility.isAvailable() || facility.getStatus() == ResourceStatus.OUT_OF_SERVICE) {
            throw new ResponseStatusException(BAD_REQUEST, "Facility is currently not available for booking");
        }

        if (
            request.getExpectedAttendees() != null &&
            request.getExpectedAttendees() > facility.getCapacity()
        ) {
            throw new ResponseStatusException(
                BAD_REQUEST,
                "Expected attendees cannot exceed facility capacity of " + facility.getCapacity()
            );
        }

        List<Booking> conflicts = bookingRepository.findByFacilityIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            facility.getId(),
            Set.of(BookingStatus.PENDING, BookingStatus.APPROVED),
            request.getEndTime(),
            request.getStartTime()
        );

        Booking booking = new Booking();
        booking.setFacility(facility);
        booking.setUser(user);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setExpectedAttendees(request.getExpectedAttendees());
        booking.setConflictFlag(!conflicts.isEmpty());
        booking.setStatus(conflicts.isEmpty() ? BookingStatus.PENDING : BookingStatus.REJECTED);

        Booking saved = bookingRepository.save(booking);

        if (saved.getStatus() == BookingStatus.REJECTED) {
            notificationService.create(
                user,
                NotificationType.BOOKING,
                "Your booking for " + facility.getName() + " was rejected due to a time conflict."
            );
        } else {
            notificationService.create(
                user,
                NotificationType.BOOKING,
                "Booking request created for " + facility.getName() + " and awaiting review."
            );
        }

        return saved;
    }

    public List<Booking> listAll() {
        return bookingRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Booking> listMine(User user) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public Booking decide(Long id, BookingDecisionRequest request, User admin) {
        Booking booking = bookingRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found"));

        String decision = request.getDecision().trim().toUpperCase();
        if (!decision.equals("APPROVED") && !decision.equals("REJECTED")) {
            throw new ResponseStatusException(BAD_REQUEST, "Decision must be APPROVED or REJECTED");
        }

        booking.setStatus(BookingStatus.valueOf(decision));
        booking.setDecisionComment(request.getComment());

        notificationService.create(
            booking.getUser(),
            NotificationType.BOOKING,
            "Booking for " + booking.getFacility().getName() + " was " + decision +
            (request.getComment() != null && !request.getComment().isBlank() ? ": " + request.getComment() : "")
        );

        return booking;
    }

    @Transactional
    public Booking cancel(Long id, User actor) {
        Booking booking = bookingRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found"));

        boolean isOwner = booking.getUser().getId().equals(actor.getId());
        boolean isAdmin = actor.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(FORBIDDEN, "You can only cancel your own booking");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ResponseStatusException(BAD_REQUEST, "Booking is already cancelled");
        }

        if (booking.getStartTime().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Cannot cancel a booking that already started");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setDecisionComment(isOwner ? "Cancelled by user" : "Cancelled by admin");

        if (!isOwner) {
            notificationService.create(
                booking.getUser(),
                NotificationType.BOOKING,
                "Your booking for " + booking.getFacility().getName() + " was cancelled by admin."
            );
        }

        return booking;
    }
}
