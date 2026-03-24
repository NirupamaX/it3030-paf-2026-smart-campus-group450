-- CampusX complete MySQL schema
-- Compatible with MySQL 8+

CREATE DATABASE IF NOT EXISTS campusx
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campusx;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  active BIT(1) NOT NULL DEFAULT b'1',
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT uk_users_email UNIQUE (email),
  CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'STUDENT', 'TECHNICIAN'))
);

CREATE TABLE IF NOT EXISTS facilities (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INT NOT NULL,
  description VARCHAR(2000),
  available BIT(1) NOT NULL DEFAULT b'1',
  status VARCHAR(32) NOT NULL,
  operating_hours VARCHAR(255) NOT NULL DEFAULT '08:00-20:00',
  opening_time VARCHAR(255) NOT NULL,
  closing_time VARCHAR(255) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT pk_facilities PRIMARY KEY (id),
  CONSTRAINT chk_facilities_status CHECK (status IN ('AVAILABLE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE')),
  CONSTRAINT chk_facilities_capacity CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT NOT NULL AUTO_INCREMENT,
  resource_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME(6) NOT NULL,
  end_time TIME(6) NOT NULL,
  purpose VARCHAR(1000) NOT NULL,
  expected_attendees INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  rejection_reason VARCHAR(1000),
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT pk_bookings PRIMARY KEY (id),
  CONSTRAINT fk_bookings_resource FOREIGN KEY (resource_id) REFERENCES facilities (id),
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT chk_bookings_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  CONSTRAINT chk_bookings_time CHECK (end_time > start_time),
  CONSTRAINT chk_bookings_expected_attendees CHECK (expected_attendees > 0)
);

CREATE TABLE IF NOT EXISTS incident_tickets (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  location VARCHAR(255) NOT NULL,
  category VARCHAR(32) NOT NULL,
  priority VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  reporter_id BIGINT NOT NULL,
  technician_id BIGINT NULL,
  resolution_note VARCHAR(2000),
  image_url VARCHAR(500),
  preferred_contact VARCHAR(200),
  rejection_reason VARCHAR(1000),
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT pk_incident_tickets PRIMARY KEY (id),
  CONSTRAINT fk_incidents_reporter FOREIGN KEY (reporter_id) REFERENCES users (id),
  CONSTRAINT fk_incidents_technician FOREIGN KEY (technician_id) REFERENCES users (id),
  CONSTRAINT chk_incidents_category CHECK (category IN ('ELECTRICAL', 'NETWORK', 'PLUMBING', 'HARDWARE', 'SOFTWARE', 'OTHER')),
  CONSTRAINT chk_incidents_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  CONSTRAINT chk_incidents_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'))
);

CREATE TABLE IF NOT EXISTS incident_attachments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT pk_incident_attachments PRIMARY KEY (id),
  CONSTRAINT fk_incident_attachments_incident FOREIGN KEY (incident_id) REFERENCES incident_tickets (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  content VARCHAR(2000) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT pk_ticket_comments PRIMARY KEY (id),
  CONSTRAINT fk_ticket_comments_incident FOREIGN KEY (incident_id) REFERENCES incident_tickets (id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_comments_author FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  type VARCHAR(32) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  is_read BIT(1) NOT NULL DEFAULT b'0',
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT pk_notifications PRIMARY KEY (id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT chk_notifications_type CHECK (type IN ('BOOKING', 'INCIDENT', 'SYSTEM'))
);

CREATE INDEX idx_bookings_resource ON bookings (resource_id);
CREATE INDEX idx_bookings_user ON bookings (user_id);
CREATE INDEX idx_bookings_time_window ON bookings (resource_id, booking_date, start_time, end_time);
CREATE INDEX idx_incidents_reporter ON incident_tickets (reporter_id);
CREATE INDEX idx_incidents_technician ON incident_tickets (technician_id);
CREATE INDEX idx_incidents_status_updated ON incident_tickets (status, updated_at);
CREATE INDEX idx_incident_attachments_incident ON incident_attachments (incident_id);
CREATE INDEX idx_ticket_comments_incident_created ON ticket_comments (incident_id, created_at);
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at);

-- Optional seed users. Replace password hashes if you need specific credentials.
-- These hashes correspond to sample passwords and can be changed by app startup initializer.
INSERT IGNORE INTO users (full_name, email, password, role, active, created_at)
VALUES
('CampusX Admin', 'admin@campusx.com', '$2a$10$3A2N8rtBz8f0D0V6A37YWOY2scA3n8To8rV3tKfW4QH6gM6M6x1cK', 'ADMIN', b'1', NOW(6)),
('Campus Technician', 'tech@campusx.com', '$2a$10$A5X9Y3m3m7kq3V9nR8yv2uW5eXh7V5n7P8dxW8aS9w0k2p3j7v2zS', 'TECHNICIAN', b'1', NOW(6));
