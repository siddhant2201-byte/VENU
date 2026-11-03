package com.project.event_management_system.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HoldSeatRequest {

    @NotEmpty(message = "At least one seat must be selected to hold")
    private List<Long> seatIds;
}
