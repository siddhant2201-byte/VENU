package com.project.event_management_system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {

    @NotBlank(message = "Hold token is required to finalize booking")
    private String holdToken;

    @NotBlank(message = "Idempotency key is required to guarantee duplicate safety")
    private String idempotencyKey;

    @Builder.Default
    private String paymentMethod = "MOCK_CARD";

    @Builder.Default
    private String cardLast4 = "4242";
}
