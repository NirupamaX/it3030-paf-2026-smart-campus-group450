package com.example.backend.repository;

import com.example.backend.model.Booking;
import com.example.backend.model.BookingStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    @Query(
        """
        SELECT b FROM Booking b
        WHERE b.facility.id = :resourceId
          AND b.bookingDate = :bookingDate
          AND b.status IN :statuses
          AND b.startTime < :endTime
          AND b.endTime > :startTime
        """
    )
    List<Booking> findOverlappingBookings(
        @Param("resourceId") Long resourceId,
        @Param("bookingDate") LocalDate bookingDate,
        @Param("statuses") Collection<BookingStatus> statuses,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );

    Page<Booking> findByUserId(Long userId, Pageable pageable);

    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);

    Page<Booking> findByBookingDate(LocalDate bookingDate, Pageable pageable);

    Page<Booking> findByStatusAndBookingDate(BookingStatus status, LocalDate bookingDate, Pageable pageable);

    // kept for non-paginated internal use (conflict checks etc.)
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    List<Booking> findByBookingDateOrderByCreatedAtDesc(LocalDate bookingDate);

    List<Booking> findByStatusAndBookingDateOrderByCreatedAtDesc(BookingStatus status, LocalDate bookingDate);

    List<Booking> findAllByOrderByCreatedAtDesc();
}

