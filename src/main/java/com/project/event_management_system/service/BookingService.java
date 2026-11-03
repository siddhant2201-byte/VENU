package com.project.event_management_system.service;

import com.project.event_management_system.dto.BookingResponse;
import com.project.event_management_system.dto.CreateBookingRequest;
import com.project.event_management_system.dto.SeatResponse;
import com.project.event_management_system.exception.BadRequestException;
import com.project.event_management_system.exception.ResourceNotFoundException;
import com.project.event_management_system.model.*;
import com.project.event_management_system.repository.BookingRepository;
import com.project.event_management_system.repository.EventRepository;
import com.project.event_management_system.repository.SeatRepository;
import com.project.event_management_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.event_management_system.dto.BookingConfirmedEvent;
import com.project.event_management_system.model.OutboxEvent;
import com.project.event_management_system.model.OutboxStatus;
import com.project.event_management_system.model.Ticket;
import com.project.event_management_system.model.TicketStatus;
import com.project.event_management_system.repository.OutboxEventRepository;
import com.project.event_management_system.repository.TicketRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String SEAT_HOLD_KEY_PREFIX = "event:%d:seat:%d:hold";
    private static final String HOLD_TOKEN_KEY_PREFIX = "hold:%s";

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request, Long currentUserId) {

        Optional<Booking> existingBooking = bookingRepository.findByIdempotencyKey(request.getIdempotencyKey());
        if (existingBooking.isPresent()) {
            log.info("Idempotent booking hit for key {}. Returning existing booking reference {}",
                    request.getIdempotencyKey(), existingBooking.get().getBookingReference());
            return mapToResponse(existingBooking.get());
        }

        String tokenKey = String.format(HOLD_TOKEN_KEY_PREFIX, request.getHoldToken());
        String holdData = redisTemplate.opsForValue().get(tokenKey);
        if (holdData == null) {
            throw new BadRequestException("Hold session expired or invalid. Please select your seats again.");
        }

        String[] parts = holdData.split(":");
        if (parts.length < 3) {
            throw new BadRequestException("Malformed hold session data. Please select your seats again.");
        }

        Long eventId = Long.parseLong(parts[0]);
        Long holdUserId = Long.parseLong(parts[1]);

        if (!holdUserId.equals(currentUserId)) {
            throw new BadRequestException("The seat hold does not belong to the current user.");
        }

        List<Long> seatIds = Arrays.stream(parts[2].split(","))
                .filter(s -> !s.isBlank())
                .map(Long::parseLong)
                .collect(Collectors.toList());

        if (seatIds.isEmpty()) {
            throw new BadRequestException("No seats found in this hold session.");
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        List<Seat> seats = seatRepository.findByEventIdAndIdIn(eventId, seatIds);
        if (seats.size() != seatIds.size()) {
            throw new BadRequestException("One or more held seats are no longer valid for this event.");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (Seat seat : seats) {
            if (seat.getStatus() == SeatStatus.BOOKED) {
                throw new BadRequestException("Seat " + seat.getSeatNumber() + " has already been booked.");
            }
            totalAmount = totalAmount.add(seat.getPrice());
            seat.setStatus(SeatStatus.BOOKED);
        }

        seatRepository.saveAll(seats);

        int updatedAvailable = Math.max(0, event.getAvailableSeats() - seats.size());
        event.setAvailableSeats(updatedAvailable);
        eventRepository.save(event);

        String bookingReference = "BK-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        Booking booking = Booking.builder()
                .bookingReference(bookingReference)
                .user(user)
                .event(event)
                .totalAmount(totalAmount)
                .status(BookingStatus.CONFIRMED)
                .idempotencyKey(request.getIdempotencyKey())
                .seats(new HashSet<>(seats))
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        List<Ticket> tickets = new ArrayList<>();
        for (Seat seat : seats) {
            String ticketCode = "TCK-" + System.currentTimeMillis() + "-" + seat.getSeatNumber().replaceAll("[^a-zA-Z0-9]", "") + "-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
            String qrHash = "QR-" + savedBooking.getId() + "-" + seat.getId() + "-" + UUID.randomUUID().toString();

            Ticket ticket = Ticket.builder()
                    .ticketCode(ticketCode)
                    .booking(savedBooking)
                    .seat(seat)
                    .qrCodeHash(qrHash)
                    .status(TicketStatus.VALID)
                    .build();
            tickets.add(ticket);
        }
        ticketRepository.saveAll(tickets);
        log.info("Generated {} digital tickets for booking {}", tickets.size(), savedBooking.getBookingReference());

        try {
            BookingConfirmedEvent eventPayload = BookingConfirmedEvent.builder()
                    .bookingReference(savedBooking.getBookingReference())
                    .eventId(event.getId())
                    .eventTitle(event.getTitle())
                    .venueName(event.getVenue() != null ? event.getVenue().getName() : "TBD")
                    .venueCity(event.getVenue() != null ? event.getVenue().getCity() : "TBD")
                    .eventStartTime(event.getStartTime())
                    .userId(user.getId())
                    .userFullName(user.getFullName())
                    .userEmail(user.getEmail())
                    .totalAmount(totalAmount)
                    .seats(mapToResponse(savedBooking).getSeats())
                    .confirmedAt(savedBooking.getCreatedAt() != null ? savedBooking.getCreatedAt() : LocalDateTime.now())
                    .build();

            String payloadJson = objectMapper.writeValueAsString(eventPayload);

            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .aggregateType("BOOKING")
                    .aggregateId(savedBooking.getBookingReference())
                    .eventType("BOOKING_CONFIRMED")
                    .payload(payloadJson)
                    .status(OutboxStatus.PENDING)
                    .retryCount(0)
                    .build();

            outboxEventRepository.save(outboxEvent);
            log.info("Transactional outbox event created for booking {}", savedBooking.getBookingReference());
        } catch (Exception e) {
            log.error("Failed to serialize or save outbox event for booking {}", savedBooking.getBookingReference(), e);
            throw new RuntimeException("Failed to register transactional outbox event: " + e.getMessage(), e);
        }

        for (Long seatId : seatIds) {
            String seatKey = String.format(SEAT_HOLD_KEY_PREFIX, eventId, seatId);
            redisTemplate.delete(seatKey);
        }
        redisTemplate.delete(tokenKey);

        log.info("Booking confirmed successfully! Ref: {}, User: {}, Event: {}, Seats: {}",
                savedBooking.getBookingReference(), currentUserId, eventId, seatIds);

        return mapToResponse(savedBooking);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getUserBookings(Long userId, Pageable pageable) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingByReference(String reference, Long currentUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findWithDetailsByBookingReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with reference: " + reference));

        if (!isAdmin && !booking.getUser().getId().equals(currentUserId)) {
            throw new BadRequestException("You are not authorized to view this booking.");
        }

        return mapToResponse(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(String reference, Long currentUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findWithDetailsByBookingReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with reference: " + reference));

        if (!isAdmin && !booking.getUser().getId().equals(currentUserId)) {
            throw new BadRequestException("You are not authorized to cancel this booking.");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking has already been cancelled.");
        }

        booking.setStatus(BookingStatus.CANCELLED);

        Set<Seat> seats = booking.getSeats();
        for (Seat seat : seats) {
            seat.setStatus(SeatStatus.AVAILABLE);
        }
        seatRepository.saveAll(seats);

        Event event = booking.getEvent();
        event.setAvailableSeats(event.getAvailableSeats() + seats.size());
        eventRepository.save(event);

        List<Ticket> tickets = ticketRepository.findByBookingId(booking.getId());
        for (Ticket ticket : tickets) {
            ticket.setStatus(TicketStatus.CANCELLED);
        }
        ticketRepository.saveAll(tickets);

        Booking updatedBooking = bookingRepository.save(booking);
        log.info("Booking {} successfully cancelled by user {}", reference, currentUserId);

        return mapToResponse(updatedBooking);
    }

    private BookingResponse mapToResponse(Booking booking) {
        List<SeatResponse> seatResponses = booking.getSeats() != null ?
                booking.getSeats().stream()
                        .map(seat -> SeatResponse.builder()
                                .id(seat.getId())
                                .seatNumber(seat.getSeatNumber())
                                .rowLabel(seat.getRowLabel())
                                .section(seat.getSection())
                                .seatType(seat.getSeatType())
                                .price(seat.getPrice())
                                .status(seat.getStatus())
                                .heldByCurrentUser(false)
                                .build())
                        .sorted(Comparator.comparing(SeatResponse::getRowLabel, Comparator.nullsLast(Comparator.naturalOrder()))
                                .thenComparing(SeatResponse::getSeatNumber, Comparator.nullsLast(Comparator.naturalOrder())))
                        .collect(Collectors.toList())
                : Collections.emptyList();

        return BookingResponse.builder()
                .id(booking.getId())
                .bookingReference(booking.getBookingReference())
                .eventId(booking.getEvent() != null ? booking.getEvent().getId() : null)
                .eventTitle(booking.getEvent() != null ? booking.getEvent().getTitle() : null)
                .venueName(booking.getEvent() != null && booking.getEvent().getVenue() != null ?
                        booking.getEvent().getVenue().getName() : "TBD")
                .eventStartTime(booking.getEvent() != null ? booking.getEvent().getStartTime() : null)
                .userId(booking.getUser() != null ? booking.getUser().getId() : null)
                .userFullName(booking.getUser() != null ? booking.getUser().getFullName() : null)
                .userEmail(booking.getUser() != null ? booking.getUser().getEmail() : null)
                .totalAmount(booking.getTotalAmount())
                .status(booking.getStatus())
                .seats(seatResponses)
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
