package com.project.event_management_system.controller;

import com.project.event_management_system.dto.ApiResponse;
import com.project.event_management_system.dto.HoldSeatRequest;
import com.project.event_management_system.dto.HoldSeatResponse;
import com.project.event_management_system.dto.ReleaseSeatRequest;
import com.project.event_management_system.dto.SeatResponse;
import com.project.event_management_system.security.UserPrincipal;
import com.project.event_management_system.service.SeatHoldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/seats")
@RequiredArgsConstructor
public class SeatController {

    private final SeatHoldService seatHoldService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SeatResponse>>> getSeatLayout(
            @PathVariable Long eventId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        List<SeatResponse> layout = seatHoldService.getSeatLayout(eventId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(layout, "Seat layout retrieved successfully"));
    }

    @PostMapping("/hold")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<HoldSeatResponse>> holdSeats(
            @PathVariable Long eventId,
            @Valid @RequestBody HoldSeatRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        HoldSeatResponse response = seatHoldService.holdSeats(eventId, request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Seats held successfully for 5 minutes"));
    }

    @PostMapping("/release")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> releaseSeats(
            @PathVariable Long eventId,
            @Valid @RequestBody ReleaseSeatRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        seatHoldService.releaseSeats(eventId, request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.<Void>success("Seats released successfully", null));
    }
}
