package com.project.event_management_system.repository;

import com.project.event_management_system.model.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByBookingReference(String bookingReference);

    Optional<Booking> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT b FROM Booking b JOIN FETCH b.event e LEFT JOIN FETCH e.venue LEFT JOIN FETCH b.seats WHERE b.bookingReference = :reference")
    Optional<Booking> findWithDetailsByBookingReference(@Param("reference") String reference);

    @Query(value = "SELECT b FROM Booking b JOIN FETCH b.event e LEFT JOIN FETCH e.venue WHERE b.user.id = :userId ORDER BY b.createdAt DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.user.id = :userId")
    Page<Booking> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT b FROM Booking b JOIN FETCH b.user u WHERE b.event.id = :eventId ORDER BY b.createdAt DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.event.id = :eventId")
    Page<Booking> findByEventIdOrderByCreatedAtDesc(@Param("eventId") Long eventId, Pageable pageable);

    @Query("SELECT b FROM Booking b JOIN FETCH b.event e LEFT JOIN FETCH e.venue JOIN FETCH b.user u LEFT JOIN FETCH b.seats WHERE e.organizer.id = :organizerId AND b.status = 'CONFIRMED' ORDER BY b.createdAt DESC")
    java.util.List<Booking> findConfirmedWithDetailsByOrganizerId(@Param("organizerId") Long organizerId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.event e LEFT JOIN FETCH e.venue JOIN FETCH b.user u LEFT JOIN FETCH b.seats WHERE b.status = 'CONFIRMED' ORDER BY b.createdAt DESC")
    java.util.List<Booking> findAllConfirmedWithDetails();
}
