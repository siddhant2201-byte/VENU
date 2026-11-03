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
public class TierAnalyticsDto {
    private String tier;
    private long totalSeats;
    private long soldSeats;
    private BigDecimal revenue;
    private double occupancyRate;
}
