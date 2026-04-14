package com.example.backend.service;

import com.example.backend.dto.BookingRequest;
import com.example.backend.model.Booking;
import com.example.backend.model.BookingStatus;
import com.example.backend.model.Facility;
import com.example.backend.model.ResourceStatus;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.BookingRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private FacilityService facilityService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BookingService bookingService;

    private User user;
    private Facility facility;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(10L);
        user.setRole(Role.USER);

        facility = new Facility();
        facility.setId(5L);
        facility.setName("Engineering Lab");
        facility.setAvailable(true);
        facility.setStatus(ResourceStatus.ACTIVE);
        facility.setCapacity(40);
        facility.setOpeningTime("08:00");
        facility.setClosingTime("20:00");
    }

    @Test
    void createBooking_throwsConflict_whenOverlappingSlotExists() {
        BookingRequest request = new BookingRequest();
        request.setResourceId(5L);
        request.setBookingDate(LocalDate.now().plusDays(2));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(11, 0));
        request.setPurpose("Project workshop");
        request.setExpectedAttendees(20);

        Booking conflict = new Booking();
        conflict.setId(22L);
        conflict.setStatus(BookingStatus.APPROVED);

        when(facilityService.getById(5L)).thenReturn(facility);
        when(
            bookingRepository.findOverlappingBookings(
                eq(5L),
                eq(request.getBookingDate()),
                eq(Set.of(BookingStatus.PENDING, BookingStatus.APPROVED)),
                eq(request.getStartTime()),
                eq(request.getEndTime())
            )
        ).thenReturn(List.of(conflict));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> bookingService.create(request, user));

        assertTrue(ex.getReason().contains("overlaps"));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void createBooking_throwsBadRequest_whenOutsideOperatingHours() {
        BookingRequest request = new BookingRequest();
        request.setResourceId(5L);
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(7, 45));
        request.setEndTime(LocalTime.of(8, 30));
        request.setPurpose("Early check");
        request.setExpectedAttendees(10);

        when(facilityService.getById(5L)).thenReturn(facility);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> bookingService.create(request, user));

        assertTrue(ex.getReason().contains("operating hours"));
        verify(bookingRepository, never()).save(any(Booking.class));
    }
}
