package com.project.event_management_system.service;

import com.project.event_management_system.dto.*;
import com.project.event_management_system.model.*;
import com.project.event_management_system.repository.BookingRepository;
import com.project.event_management_system.repository.EventRepository;
import com.project.event_management_system.repository.SeatRepository;
import com.project.event_management_system.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final SeatRepository seatRepository;

    @Transactional(readOnly = true)
    public OrganizerAnalyticsResponse getOrganizerAnalytics(Long organizerId, boolean isAdmin) {
        log.info("Computing analytics for user {} (isAdmin: {})", organizerId, isAdmin);

        List<Event> events = isAdmin
                ? eventRepository.findAll()
                : eventRepository.findByOrganizerId(organizerId);

        List<Booking> bookings = isAdmin
                ? bookingRepository.findAllConfirmedWithDetails()
                : bookingRepository.findConfirmedWithDetailsByOrganizerId(organizerId);

        long totalEvents = events.size();
        long publishedEvents = events.stream()
                .filter(e -> e.getStatus() == EventStatus.PUBLISHED)
                .count();

        long totalSeats = events.stream().mapToLong(Event::getTotalSeats).sum();
        long availableSeats = events.stream().mapToLong(Event::getAvailableSeats).sum();
        long soldSeats = Math.max(0, totalSeats - availableSeats);

        double occupancyRate = totalSeats > 0
                ? ((double) soldSeats / totalSeats) * 100.0
                : 0.0;
        occupancyRate = Math.round(occupancyRate * 10.0) / 10.0;

        BigDecimal totalRevenue = bookings.stream()
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalCheckIns = isAdmin
                ? ticketRepository.countByStatus(TicketStatus.USED)
                : ticketRepository.countByOrganizerIdAndStatus(organizerId, TicketStatus.USED);

        double checkInRate = soldSeats > 0
                ? ((double) totalCheckIns / soldSeats) * 100.0
                : 0.0;
        checkInRate = Math.round(checkInRate * 10.0) / 10.0;

        Map<SeatType, Long> totalPerTier = new HashMap<>();
        Map<SeatType, Long> soldPerTier = new HashMap<>();
        Map<SeatType, BigDecimal> revenuePerTier = new HashMap<>();

        for (Event event : events) {
            List<Seat> seats = seatRepository.findByEventIdOrderByRowLabelAscSeatNumberAsc(event.getId());
            for (Seat seat : seats) {
                totalPerTier.merge(seat.getSeatType(), 1L, Long::sum);
                if (seat.getStatus() == SeatStatus.BOOKED) {
                    soldPerTier.merge(seat.getSeatType(), 1L, Long::sum);
                    revenuePerTier.merge(seat.getSeatType(), seat.getPrice(), BigDecimal::add);
                }
            }
        }

        List<TierAnalyticsDto> tierBreakdowns = new ArrayList<>();
        for (SeatType type : SeatType.values()) {
            long tTotal = totalPerTier.getOrDefault(type, 0L);
            long tSold = soldPerTier.getOrDefault(type, 0L);
            BigDecimal tRev = revenuePerTier.getOrDefault(type, BigDecimal.ZERO);
            double tOcc = tTotal > 0 ? ((double) tSold / tTotal) * 100.0 : 0.0;
            tOcc = Math.round(tOcc * 10.0) / 10.0;

            tierBreakdowns.add(TierAnalyticsDto.builder()
                    .tier(type.name())
                    .totalSeats(tTotal)
                    .soldSeats(tSold)
                    .revenue(tRev)
                    .occupancyRate(tOcc)
                    .build());
        }

        List<EventPerformanceDto> eventPerformances = events.stream()
                .map(event -> {
                    int eTotal = event.getTotalSeats();
                    int eAvail = event.getAvailableSeats();
                    int eSold = Math.max(0, eTotal - eAvail);
                    double eOcc = eTotal > 0 ? ((double) eSold / eTotal) * 100.0 : 0.0;
                    eOcc = Math.round(eOcc * 10.0) / 10.0;

                    BigDecimal eRev = bookings.stream()
                            .filter(b -> b.getEvent().getId().equals(event.getId()))
                            .map(Booking::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return EventPerformanceDto.builder()
                            .eventId(event.getId())
                            .title(event.getTitle())
                            .venueName(event.getVenue() != null ? event.getVenue().getName() : "TBD")
                            .status(event.getStatus().name())
                            .totalSeats(eTotal)
                            .soldSeats(eSold)
                            .availableSeats(eAvail)
                            .revenue(eRev)
                            .occupancyRate(eOcc)
                            .build();
                })
                .sorted(Comparator.comparing(EventPerformanceDto::getRevenue).reversed())
                .collect(Collectors.toList());

        List<RecentSaleDto> recentSales = bookings.stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt).reversed())
                .limit(10)
                .map(b -> RecentSaleDto.builder()
                        .bookingReference(b.getBookingReference())
                        .eventTitle(b.getEvent().getTitle())
                        .attendeeName(b.getUser() != null ? b.getUser().getFullName() : "Anonymous")
                        .attendeeEmail(b.getUser() != null ? b.getUser().getEmail() : "")
                        .totalAmount(b.getTotalAmount())
                        .seatCount(b.getSeats() != null ? b.getSeats().size() : 0)
                        .createdAt(b.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return OrganizerAnalyticsResponse.builder()
                .totalEvents(totalEvents)
                .publishedEvents(publishedEvents)
                .totalSeats(totalSeats)
                .soldSeats(soldSeats)
                .availableSeats(availableSeats)
                .overallOccupancyRate(occupancyRate)
                .totalRevenue(totalRevenue)
                .totalCheckIns(totalCheckIns)
                .checkInRate(checkInRate)
                .tierBreakdowns(tierBreakdowns)
                .eventPerformances(eventPerformances)
                .recentSales(recentSales)
                .build();
    }
}
