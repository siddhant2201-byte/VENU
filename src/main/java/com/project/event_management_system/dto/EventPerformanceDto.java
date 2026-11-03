package com.project.event_management_system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventPerformanceDto {
    private Long eventId;
    private String title;
    private String venueName;
    private String status;
    private int totalSeats;
    private int soldSeats;
    private int availableSeats;
    private BigDecimal revenue;
    private double occupancyRate;
}
