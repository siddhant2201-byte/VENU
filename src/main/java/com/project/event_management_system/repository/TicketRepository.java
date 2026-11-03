package com.project.event_management_system.repository;

import com.project.event_management_system.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketCode(String ticketCode);

    Optional<Ticket> findByQrCodeHash(String qrCodeHash);

    List<Ticket> findByBookingId(Long bookingId);

    List<Ticket> findByBookingBookingReference(String bookingReference);

    @Query("SELECT t FROM Ticket t JOIN FETCH t.booking b JOIN FETCH b.event e LEFT JOIN FETCH e.venue JOIN FETCH b.user u JOIN FETCH t.seat s WHERE t.ticketCode = :ticketCode")
    Optional<Ticket> findWithDetailsByTicketCode(@Param("ticketCode") String ticketCode);

    @Query("SELECT t FROM Ticket t JOIN FETCH t.booking b JOIN FETCH b.event e LEFT JOIN FETCH e.venue JOIN FETCH b.user u JOIN FETCH t.seat s WHERE t.qrCodeHash = :qrCodeHash")
    Optional<Ticket> findWithDetailsByQrCodeHash(@Param("qrCodeHash") String qrCodeHash);

    @Query("SELECT t FROM Ticket t JOIN FETCH t.booking b JOIN FETCH b.event e LEFT JOIN FETCH e.venue JOIN FETCH b.user u JOIN FETCH t.seat s WHERE t.booking.bookingReference = :reference ORDER BY t.id ASC")
    List<Ticket> findWithDetailsByBookingReference(@Param("reference") String reference);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.booking.event.organizer.id = :organizerId AND t.status = :status")
    long countByOrganizerIdAndStatus(@Param("organizerId") Long organizerId, @Param("status") com.project.event_management_system.model.TicketStatus status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = :status")
    long countByStatus(@Param("status") com.project.event_management_system.model.TicketStatus status);
}
