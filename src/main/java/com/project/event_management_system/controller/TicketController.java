package com.project.event_management_system.controller;

import com.project.event_management_system.dto.ApiResponse;
import com.project.event_management_system.dto.CheckInRequest;
import com.project.event_management_system.dto.CheckInResponse;
import com.project.event_management_system.dto.TicketResponse;
import com.project.event_management_system.security.UserPrincipal;
import com.project.event_management_system.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/booking/{bookingReference}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getTicketsForBooking(
            @PathVariable String bookingReference,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        boolean isAdmin = userPrincipal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        List<TicketResponse> tickets = ticketService.getTicketsByBookingReference(bookingReference, userPrincipal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success(tickets, "Tickets retrieved successfully with cryptographic QR codes"));
    }

    @GetMapping("/{ticketCode}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicketByCode(
            @PathVariable String ticketCode,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        boolean isAdmin = userPrincipal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        TicketResponse ticket = ticketService.getTicketByCode(ticketCode, userPrincipal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success(ticket, "Ticket retrieved successfully"));
    }

    @PostMapping("/check-in")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CheckInResponse>> checkInTicket(
            @RequestBody CheckInRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        CheckInResponse response = ticketService.checkInTicket(request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Ticket successfully checked in. Admission granted!"));
    }

    @GetMapping("/verify/{qrOrCode}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TicketResponse>> verifyTicket(
            @PathVariable String qrOrCode
    ) {
        TicketResponse ticket = ticketService.verifyTicket(qrOrCode);
        return ResponseEntity.ok(ApiResponse.success(ticket, "Ticket verified"));
    }
}
