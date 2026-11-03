package com.project.event_management_system.dto;

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
public class RecentSaleDto {
    private String bookingReference;
    private String eventTitle;
    private String attendeeName;
    private String attendeeEmail;
    private BigDecimal totalAmount;
    private int seatCount;
    private LocalDateTime createdAt;
}
