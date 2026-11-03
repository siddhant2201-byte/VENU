package com.project.event_management_system.dto;

import com.project.event_management_system.model.SeatStatus;
import com.project.event_management_system.model.SeatType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatResponse {
    private Long id;
    private String seatNumber;
    private String rowLabel;
    private String section;
    private SeatType seatType;
    private BigDecimal price;
    private SeatStatus status;
    private boolean heldByCurrentUser;
}
