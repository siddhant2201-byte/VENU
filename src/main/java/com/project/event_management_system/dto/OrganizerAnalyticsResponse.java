package com.project.event_management_system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizerAnalyticsResponse {
    private long totalEvents;
    private long publishedEvents;
    private long totalSeats;
    private long soldSeats;
    private long availableSeats;
    private double overallOccupancyRate;
    private BigDecimal totalRevenue;
    private long totalCheckIns;
    private double checkInRate;
    private List<TierAnalyticsDto> tierBreakdowns;
    private List<EventPerformanceDto> eventPerformances;
    private List<RecentSaleDto> recentSales;
}
