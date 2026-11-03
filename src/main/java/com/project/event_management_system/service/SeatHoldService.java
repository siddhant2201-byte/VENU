package com.project.event_management_system.service;

import com.project.event_management_system.dto.HoldSeatRequest;
import com.project.event_management_system.dto.HoldSeatResponse;
import com.project.event_management_system.dto.ReleaseSeatRequest;
import com.project.event_management_system.dto.SeatResponse;
import com.project.event_management_system.exception.BadRequestException;
import com.project.event_management_system.exception.ResourceNotFoundException;
import com.project.event_management_system.model.Event;
import com.project.event_management_system.model.Seat;
import com.project.event_management_system.model.SeatStatus;
import com.project.event_management_system.repository.EventRepository;
import com.project.event_management_system.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeatHoldService {

    private final SeatRepository seatRepository;
    private final EventRepository eventRepository;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.booking.hold-duration-seconds:300}")
    private long holdDurationSeconds;

    private static final String SEAT_HOLD_KEY_PREFIX = "event:%d:seat:%d:hold";
    private static final String HOLD_TOKEN_KEY_PREFIX = "hold:%s";

    @Transactional(readOnly = true)
    public List<SeatResponse> getSeatLayout(Long eventId, Long currentUserId) {
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found with id: " + eventId);
        }

        List<Seat> seats = seatRepository.findByEventIdOrderByRowLabelAscSeatNumberAsc(eventId);
        String currentUserIdStr = currentUserId != null ? currentUserId.toString() : "";

        return seats.stream().map(seat -> {
            SeatStatus computedStatus = seat.getStatus();
            boolean isHeldByCurrent = false;

            if (seat.getStatus() != SeatStatus.BOOKED) {
                String redisKey = String.format(SEAT_HOLD_KEY_PREFIX, eventId, seat.getId());
                String holdingUser = redisTemplate.opsForValue().get(redisKey);

                if (holdingUser != null) {
                    computedStatus = SeatStatus.HELD;
                    isHeldByCurrent = holdingUser.equals(currentUserIdStr);
                } else {
                    computedStatus = SeatStatus.AVAILABLE;
                }
            }

            return SeatResponse.builder()
                    .id(seat.getId())
                    .seatNumber(seat.getSeatNumber())
                    .rowLabel(seat.getRowLabel())
                    .section(seat.getSection())
                    .seatType(seat.getSeatType())
                    .price(seat.getPrice())
                    .status(computedStatus)
                    .heldByCurrentUser(isHeldByCurrent)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public HoldSeatResponse holdSeats(Long eventId, HoldSeatRequest request, Long userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        List<Long> seatIds = request.getSeatIds();
        if (seatIds.size() > 10) {
            throw new BadRequestException("You can hold a maximum of 10 seats at a time");
        }

        List<Seat> seats = seatRepository.findByEventIdAndIdIn(eventId, seatIds);
        if (seats.size() != seatIds.size()) {
            throw new BadRequestException("One or more selected seats do not belong to this event");
        }

        for (Seat seat : seats) {
            if (seat.getStatus() == SeatStatus.BOOKED) {
                throw new BadRequestException("Seat " + seat.getSeatNumber() + " is already booked and unavailable");
            }
        }

        String userIdStr = userId.toString();
        List<String> successfullyHeldKeys = new ArrayList<>();
        BigDecimal totalPrice = BigDecimal.ZERO;

        try {

            for (Seat seat : seats) {
                String redisKey = String.format(SEAT_HOLD_KEY_PREFIX, eventId, seat.getId());
                Boolean acquired = redisTemplate.opsForValue().setIfAbsent(
                        redisKey,
                        userIdStr,
                        Duration.ofSeconds(holdDurationSeconds)
                );

                if (Boolean.TRUE.equals(acquired)) {
                    successfullyHeldKeys.add(redisKey);
                    totalPrice = totalPrice.add(seat.getPrice());
                } else {

                    String currentHolder = redisTemplate.opsForValue().get(redisKey);
                    if (userIdStr.equals(currentHolder)) {
                        redisTemplate.expire(redisKey, Duration.ofSeconds(holdDurationSeconds));
                        successfullyHeldKeys.add(redisKey);
                        totalPrice = totalPrice.add(seat.getPrice());
                    } else {

                        throw new BadRequestException("Seat " + seat.getSeatNumber() + " is currently held by another user. Please choose another seat.");
                    }
                }
            }

            String holdToken = UUID.randomUUID().toString();
            String tokenKey = String.format(HOLD_TOKEN_KEY_PREFIX, holdToken);
            String payload = String.format("%d:%d:%s", eventId, userId, seatIds.stream().map(String::valueOf).collect(Collectors.joining(",")));

            redisTemplate.opsForValue().set(tokenKey, payload, Duration.ofSeconds(holdDurationSeconds));

            LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(holdDurationSeconds);

            log.info("User {} successfully held seats {} for event {} (token: {})", userId, seatIds, eventId, holdToken);

            return HoldSeatResponse.builder()
                    .holdToken(holdToken)
                    .eventId(eventId)
                    .userId(userId)
                    .heldSeatIds(seatIds)
                    .totalPrice(totalPrice)
                    .expiresInSeconds(holdDurationSeconds)
                    .expiresAt(expiresAt)
                    .build();

        } catch (Exception ex) {

            for (String key : successfullyHeldKeys) {
                String holder = redisTemplate.opsForValue().get(key);
                if (userIdStr.equals(holder)) {
                    redisTemplate.delete(key);
                }
            }
            throw ex;
        }
    }

    public void releaseSeats(Long eventId, ReleaseSeatRequest request, Long userId) {
        String userIdStr = userId.toString();

        for (Long seatId : request.getSeatIds()) {
            String redisKey = String.format(SEAT_HOLD_KEY_PREFIX, eventId, seatId);
            String holder = redisTemplate.opsForValue().get(redisKey);
            if (userIdStr.equals(holder)) {
                redisTemplate.delete(redisKey);
                log.info("User {} released hold on seat {} for event {}", userId, seatId, eventId);
            }
        }
    }
}
