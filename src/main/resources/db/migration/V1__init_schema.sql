-- ===================================================================
-- V1__init_schema.sql
-- Smart Event Management and Ticketing Platform Database Schema (PostgreSQL)
-- ===================================================================

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);

-- 3. User Roles Join Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 4. Venues Table
CREATE TABLE IF NOT EXISTS venues (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Events Table
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    organizer_id BIGINT NOT NULL,
    venue_id BIGINT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    banner_url VARCHAR(500),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, CANCELLED, COMPLETED
    total_seats INT NOT NULL DEFAULT 0,
    available_seats INT NOT NULL DEFAULT 0,
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_organizer FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_event_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_event_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_event_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_event_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_event_organizer ON events(organizer_id);

-- 6. Seats Table (Inventory per Event)
CREATE TABLE IF NOT EXISTS seats (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    row_label VARCHAR(10) NOT NULL,
    section VARCHAR(50) NOT NULL DEFAULT 'General',
    seat_type VARCHAR(30) NOT NULL DEFAULT 'REGULAR', -- REGULAR, VIP, VVIP
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',  -- AVAILABLE, HELD, BOOKED
    version INT NOT NULL DEFAULT 0,                   -- Optimistic lock
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seat_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT uq_event_seat UNIQUE (event_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_seat_event_status ON seats(event_id, status);

-- 7. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    booking_reference VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',    -- PENDING, CONFIRMED, CANCELLED
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_booking_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_event ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_booking_status ON bookings(status);

-- 8. Booking Seats Mapping
CREATE TABLE IF NOT EXISTS booking_seats (
    booking_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    PRIMARY KEY (booking_id, seat_id),
    CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_bs_seat FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE RESTRICT
);

-- 9. Tickets Table (Check-in and QR Token)
CREATE TABLE IF NOT EXISTS tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_code VARCHAR(64) NOT NULL UNIQUE,
    booking_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    qr_code_hash VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'VALID',       -- VALID, USED, CANCELLED
    checked_in_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_seat FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_ticket_code ON tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_ticket_qr_hash ON tickets(qr_code_hash);
CREATE INDEX IF NOT EXISTS idx_ticket_status ON tickets(status);

-- 10. Outbox Events Table (Transactional Outbox Pattern for Kafka)
CREATE TABLE IF NOT EXISTS outbox_events (
    id BIGSERIAL PRIMARY KEY,
    aggregate_type VARCHAR(100) NOT NULL,            -- e.g. 'BOOKING', 'TICKET'
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,                -- e.g. 'BOOKING_CONFIRMED', 'TICKET_CHECKED_IN'
    payload JSON NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',    -- PENDING, PUBLISHED, FAILED
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON outbox_events(status, created_at);

-- Seed Default Roles
INSERT INTO roles (name, description) VALUES
    ('ROLE_ATTENDEE', 'Regular event attendee who browses, holds seats and books tickets'),
    ('ROLE_ORGANIZER', 'Event creator who manages venues, schedules events, and checks in attendees'),
    ('ROLE_ADMIN', 'Platform administrator who oversees users, reports, and system settings')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
