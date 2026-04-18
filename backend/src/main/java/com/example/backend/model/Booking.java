package com.example.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false)
    private Facility facility;

    /**
     * Legacy compatibility column for deployments where bookings table still enforces facility_id.
     * Kept in sync from selected facility on persist/update.
     */
    @Column(name = "facility_id")
    private Long facilityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate bookingDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false, length = 1000)
    private String purpose;

    @Column(name = "expected_attendees", nullable = false)
    private Integer expectedAttendees;

    /**
     * Legacy compatibility column for deployments that still use attendees.
     * Mirrors expectedAttendees value on persist/update.
     */
    @Column(name = "attendees")
    private Integer attendees;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column(length = 1000)
    private String rejectionReason;

    @Column(name = "conflict_flag", nullable = false)
    private boolean conflictFlag = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        syncLegacyColumns();
    }

    @PreUpdate
    void onUpdate() {
        syncLegacyColumns();
    }

    private void syncLegacyColumns() {
        if (this.facility != null) {
            this.facilityId = this.facility.getId();
        }

        if (this.expectedAttendees != null) {
            this.attendees = this.expectedAttendees;
        } else if (this.attendees != null) {
            this.expectedAttendees = this.attendees;
        }
    }
}
