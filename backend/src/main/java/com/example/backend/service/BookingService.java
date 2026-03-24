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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
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
        if (request.getEndTime().isBefore(request.getStartTime()) || request.getEndTime().equals(request.getStartTime())) {
            throw new ResponseStatusException(BAD_REQUEST, "End time must be after start time");
        }

        if (request.getBookingDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Booking date cannot be in the past");
        }

        LocalDateTime requestedStartDateTime = LocalDateTime.of(request.getBookingDate(), request.getStartTime());
        if (!requestedStartDateTime.isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Start time must be in the future");
        }

        Facility facility = facilityService.getById(request.getResourceId());
        if (
            !facility.isAvailable() ||
            facility.getStatus() == ResourceStatus.OUT_OF_SERVICE ||
            facility.getStatus() == ResourceStatus.UNDER_MAINTENANCE
        ) {
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

        List<Booking> conflicts = bookingRepository.findOverlappingBookings(
            facility.getId(),
            request.getBookingDate(),
            Set.of(BookingStatus.PENDING, BookingStatus.APPROVED),
            request.getStartTime(),
            request.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            throw new ResponseStatusException(
                CONFLICT,
                "Requested time slot overlaps with an existing approved or pending booking"
            );
        }

        Booking booking = new Booking();
        booking.setFacility(facility);
        booking.setUser(user);
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setExpectedAttendees(request.getExpectedAttendees());
        booking.setStatus(BookingStatus.PENDING);

        Booking saved = bookingRepository.save(booking);

        notificationService.create(
            user,
            NotificationType.BOOKING,
            "Booking request created for " + facility.getName() + " and awaiting review."
        );

        return saved;
    }

    public boolean isSlotAvailable(Long resourceId, LocalDate bookingDate, java.time.LocalTime startTime, java.time.LocalTime endTime) {
        if (endTime.isBefore(startTime) || endTime.equals(startTime)) {
            throw new ResponseStatusException(BAD_REQUEST, "End time must be after start time");
        }

        if (bookingDate.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Booking date cannot be in the past");
        }

        Facility facility = facilityService.getById(resourceId);
        if (
            !facility.isAvailable() ||
            facility.getStatus() == ResourceStatus.OUT_OF_SERVICE ||
            facility.getStatus() == ResourceStatus.UNDER_MAINTENANCE
        ) {
            return false;
        }

        List<Booking> conflicts = bookingRepository.findOverlappingBookings(
            resourceId,
            bookingDate,
            Set.of(BookingStatus.PENDING, BookingStatus.APPROVED),
            startTime,
            endTime
        );

        return conflicts.isEmpty();
    }

    public List<Booking> listAll(BookingStatus status, LocalDate bookingDate) {
        if (status != null && bookingDate != null) {
            return bookingRepository.findByStatusAndBookingDateOrderByCreatedAtDesc(status, bookingDate);
        }

        if (status != null) {
            return bookingRepository.findByStatusOrderByCreatedAtDesc(status);
        }

        if (bookingDate != null) {
            return bookingRepository.findByBookingDateOrderByCreatedAtDesc(bookingDate);
        }

        return bookingRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Booking> listByUserId(Long userId, User actor) {
        boolean isOwner = actor.getId().equals(userId);
        boolean isAdmin = actor.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(FORBIDDEN, "You can only view your own bookings");
        }

        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Booking updateStatus(Long id, BookingDecisionRequest request, User admin) {
        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can update booking status");
        }

        Booking booking = bookingRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ResponseStatusException(BAD_REQUEST, "Cancelled booking status cannot be changed");
        }

        String nextStatusValue = request.getStatus().trim().toUpperCase();
        if (!nextStatusValue.equals("APPROVED") && !nextStatusValue.equals("REJECTED")) {
            throw new ResponseStatusException(BAD_REQUEST, "Status must be APPROVED or REJECTED");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(BAD_REQUEST, "Only pending bookings can be approved or rejected");
        }

        BookingStatus nextStatus = BookingStatus.valueOf(nextStatusValue);
        if (nextStatus == BookingStatus.REJECTED && (request.getRejectionReason() == null || request.getRejectionReason().isBlank())) {
            throw new ResponseStatusException(BAD_REQUEST, "Rejection reason is required when rejecting a booking");
        }

        if (nextStatus == BookingStatus.APPROVED) {
            List<Booking> conflicts = bookingRepository.findOverlappingBookings(
                booking.getFacility().getId(),
                booking.getBookingDate(),
                Set.of(BookingStatus.PENDING, BookingStatus.APPROVED),
                booking.getStartTime(),
                booking.getEndTime()
            );

            boolean hasOtherConflict = conflicts.stream().anyMatch(conflict -> !conflict.getId().equals(booking.getId()));
            if (hasOtherConflict) {
                throw new ResponseStatusException(CONFLICT, "Cannot approve booking due to a new scheduling conflict");
            }
        }

        booking.setStatus(nextStatus);
        booking.setRejectionReason(nextStatus == BookingStatus.REJECTED ? request.getRejectionReason().trim() : null);

        notificationService.create(
            booking.getUser(),
            NotificationType.BOOKING,
            nextStatus == BookingStatus.APPROVED
                ? "Booking for " + booking.getFacility().getName() + " has been approved."
                : "Booking for " + booking.getFacility().getName() + " has been rejected: " + booking.getRejectionReason()
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

        LocalDateTime bookingStartDateTime = LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
        if (bookingStartDateTime.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Cannot cancel a booking that already started");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setRejectionReason(null);

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
