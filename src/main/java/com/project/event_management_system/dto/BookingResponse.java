package com.project.event_management_system.dto;

import com.project.event_management_system.model.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private String bookingReference;
    private Long eventId;
    private String eventTitle;
    private String venueName;
    private LocalDateTime eventStartTime;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private BigDecimal totalAmount;
    private BookingStatus status;
    private List<SeatResponse> seats;
    private LocalDateTime createdAt;
}
