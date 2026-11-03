package com.project.event_management_system.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.project.event_management_system.model.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {

    private Long id;
    private String ticketCode;
    private String bookingReference;
    private Long eventId;
    private String eventTitle;
    private String venueName;
    private String venueCity;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime eventStartTime;

    private String attendeeName;
    private String attendeeEmail;

    private String seatNumber;
    private String rowLabel;
    private String section;
    private String seatType;
    private BigDecimal price;

    private String qrCodeHash;
    private String qrCodeBase64;
    private TicketStatus status;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime checkedInAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}
