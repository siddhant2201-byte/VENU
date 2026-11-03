package com.project.event_management_system.dto;

import com.project.event_management_system.model.EventStatus;
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
public class EventResponse {
    private Long id;
    private Long organizerId;
    private String organizerName;
    private String organizerEmail;
    private VenueResponse venue;
    private String title;
    private String description;
    private String category;
    private String bannerUrl;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private EventStatus status;
    private Integer totalSeats;
    private Integer availableSeats;
    private BigDecimal basePrice;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
