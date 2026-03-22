package com.example.backend.repository;

import com.example.backend.model.Booking;
import com.example.backend.model.BookingStatus;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByFacilityIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
        Long facilityId,
        Collection<BookingStatus> statuses,
        LocalDateTime endTime,
        LocalDateTime startTime
    );

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findAllByOrderByCreatedAtDesc();
}
