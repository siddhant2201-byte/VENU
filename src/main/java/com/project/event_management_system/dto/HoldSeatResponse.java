package com.project.event_management_system.dto;

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
public class HoldSeatResponse {
    private String holdToken;
    private Long eventId;
    private Long userId;
    private List<Long> heldSeatIds;
    private BigDecimal totalPrice;
    private Long expiresInSeconds;
    private LocalDateTime expiresAt;
}
