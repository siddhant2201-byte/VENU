package com.project.event_management_system.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.project.event_management_system.model.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInResponse {

    private String ticketCode;
    private String attendeeName;
    private String eventTitle;
    private String seatNumber;
    private String seatType;
    private TicketStatus status;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime checkedInAt;

    private String message;
}
