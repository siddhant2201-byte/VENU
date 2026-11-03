package com.project.event_management_system.service;

import com.project.event_management_system.dto.CheckInRequest;
import com.project.event_management_system.dto.CheckInResponse;
import com.project.event_management_system.dto.TicketResponse;
import com.project.event_management_system.exception.BadRequestException;
import com.project.event_management_system.exception.ResourceNotFoundException;
import com.project.event_management_system.model.Ticket;
import com.project.event_management_system.model.TicketStatus;
import com.project.event_management_system.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final QrCodeService qrCodeService;

    @Transactional(readOnly = true)
    public List<TicketResponse> getTicketsByBookingReference(String bookingReference, Long currentUserId, boolean isAdmin) {
        List<Ticket> tickets = ticketRepository.findWithDetailsByBookingReference(bookingReference);
        if (tickets.isEmpty()) {
            throw new ResourceNotFoundException("No tickets found for booking reference: " + bookingReference);
        }

        Ticket firstTicket = tickets.get(0);
        if (!isAdmin && !firstTicket.getBooking().getUser().getId().equals(currentUserId)) {
            throw new BadRequestException("You are not authorized to view these tickets.");
        }

        return tickets.stream()
                .map(this::mapToResponseWithQr)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketByCode(String ticketCode, Long currentUserId, boolean isAdmin) {
        Ticket ticket = ticketRepository.findWithDetailsByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with code: " + ticketCode));

        if (!isAdmin && !ticket.getBooking().getUser().getId().equals(currentUserId)) {
            throw new BadRequestException("You are not authorized to view this ticket.");
        }

        return mapToResponseWithQr(ticket);
    }

    @Transactional
    public CheckInResponse checkInTicket(CheckInRequest request, Long staffUserId) {
        Ticket ticket = resolveTicket(request);

        if (ticket.getStatus() == TicketStatus.USED) {
            String attendee = ticket.getBooking().getUser().getFullName();
            throw new BadRequestException(String.format(
                    "ADMISSION DENIED: Ticket was already checked in on %s (Attendee: %s). Duplicate entry blocked!",
                    ticket.getCheckedInAt(), attendee));
        }

        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new BadRequestException("ADMISSION DENIED: This ticket has been cancelled and is invalid for entry.");
        }

        ticket.setStatus(TicketStatus.USED);
        ticket.setCheckedInAt(LocalDateTime.now());
        Ticket savedTicket = ticketRepository.save(ticket);

        log.info("GATE ADMISSION SUCCESS: Ticket {} checked in by staff {} for attendee {}",
                savedTicket.getTicketCode(), staffUserId, savedTicket.getBooking().getUser().getFullName());

        return CheckInResponse.builder()
                .ticketCode(savedTicket.getTicketCode())
                .attendeeName(savedTicket.getBooking().getUser().getFullName())
                .eventTitle(savedTicket.getBooking().getEvent().getTitle())
                .seatNumber(savedTicket.getSeat().getSeatNumber())
                .seatType(savedTicket.getSeat().getSeatType().name())
                .status(savedTicket.getStatus())
                .checkedInAt(savedTicket.getCheckedInAt())
                .message("ADMISSION GRANTED: Welcome, " + savedTicket.getBooking().getUser().getFullName() + "!")
                .build();
    }

    @Transactional(readOnly = true)
    public TicketResponse verifyTicket(String codeOrHash) {
        Ticket ticket = ticketRepository.findWithDetailsByQrCodeHash(codeOrHash)
                .or(() -> ticketRepository.findWithDetailsByTicketCode(codeOrHash))
                .orElseThrow(() -> new ResourceNotFoundException("Invalid credential: No matching ticket found"));

        return mapToResponseWithQr(ticket);
    }

    private Ticket resolveTicket(CheckInRequest request) {
        if (request.getQrCodeHash() != null && !request.getQrCodeHash().isBlank()) {
            return ticketRepository.findWithDetailsByQrCodeHash(request.getQrCodeHash().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket not found for QR token: " + request.getQrCodeHash()));
        } else if (request.getTicketCode() != null && !request.getTicketCode().isBlank()) {
            return ticketRepository.findWithDetailsByTicketCode(request.getTicketCode().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket not found for code: " + request.getTicketCode()));
        } else {
            throw new BadRequestException("Either ticketCode or qrCodeHash must be provided for check-in.");
        }
    }

    private TicketResponse mapToResponseWithQr(Ticket ticket) {
        String qrBase64 = null;
        try {

            qrBase64 = qrCodeService.generateQrCodeBase64(ticket.getQrCodeHash(), 250, 250);
        } catch (Exception e) {
            log.warn("Failed to generate QR code data URI for ticket {}", ticket.getTicketCode(), e);
        }

        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .bookingReference(ticket.getBooking().getBookingReference())
                .eventId(ticket.getBooking().getEvent().getId())
                .eventTitle(ticket.getBooking().getEvent().getTitle())
                .venueName(ticket.getBooking().getEvent().getVenue() != null ?
                        ticket.getBooking().getEvent().getVenue().getName() : "TBD")
                .venueCity(ticket.getBooking().getEvent().getVenue() != null ?
                        ticket.getBooking().getEvent().getVenue().getCity() : "TBD")
                .eventStartTime(ticket.getBooking().getEvent().getStartTime())
                .attendeeName(ticket.getBooking().getUser().getFullName())
                .attendeeEmail(ticket.getBooking().getUser().getEmail())
                .seatNumber(ticket.getSeat().getSeatNumber())
                .rowLabel(ticket.getSeat().getRowLabel())
                .section(ticket.getSeat().getSection())
                .seatType(ticket.getSeat().getSeatType().name())
                .price(ticket.getSeat().getPrice())
                .qrCodeHash(ticket.getQrCodeHash())
                .qrCodeBase64(qrBase64)
                .status(ticket.getStatus())
                .checkedInAt(ticket.getCheckedInAt())
                .createdAt(ticket.getCreatedAt())
                .build();
    }
}
