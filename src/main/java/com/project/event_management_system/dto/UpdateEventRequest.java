package com.project.event_management_system.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
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
public class UpdateEventRequest {

    private Long venueId;

    @Size(max = 200, message = "Event title must not exceed 200 characters")
    private String title;

    private String description;

    @Size(max = 50, message = "Category must not exceed 50 characters")
    private String category;

    @Size(max = 500, message = "Banner URL must not exceed 500 characters")
    private String bannerUrl;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @DecimalMin(value = "0.0", inclusive = true, message = "Base price must be 0 or positive")
    private BigDecimal basePrice;
}
