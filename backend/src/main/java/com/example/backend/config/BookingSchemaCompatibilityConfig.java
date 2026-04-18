package com.example.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class BookingSchemaCompatibilityConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(BookingSchemaCompatibilityConfig.class);

    @Bean
    CommandLineRunner reconcileLegacyBookingAttendeesColumn(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                Integer attendeesColumnCount = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'bookings'
                      AND column_name = 'attendees'
                    """,
                    Integer.class
                );

                if (attendeesColumnCount == null || attendeesColumnCount == 0) {
                    return;
                }

                String isNullable = jdbcTemplate.queryForObject(
                    """
                    SELECT is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'bookings'
                      AND column_name = 'attendees'
                    """,
                    String.class
                );

                jdbcTemplate.update(
                    "UPDATE bookings SET attendees = expected_attendees WHERE attendees IS NULL AND expected_attendees IS NOT NULL"
                );

                if ("NO".equalsIgnoreCase(isNullable)) {
                    jdbcTemplate.execute("ALTER TABLE bookings MODIFY COLUMN attendees INT NULL");
                    LOGGER.info("Relaxed legacy bookings.attendees NOT NULL constraint for compatibility");
                }
            } catch (Exception ex) {
                LOGGER.warn("Skipping bookings attendees compatibility patch: {}", ex.getMessage());
            }
        };
    }
}
