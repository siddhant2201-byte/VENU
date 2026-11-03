package com.project.event_management_system.service;

import com.project.event_management_system.dto.CreateEventRequest;
import com.project.event_management_system.dto.EventResponse;
import com.project.event_management_system.dto.UpdateEventRequest;
import com.project.event_management_system.exception.BadRequestException;
import com.project.event_management_system.exception.ResourceNotFoundException;
import com.project.event_management_system.model.*;
import com.project.event_management_system.repository.EventRepository;
import com.project.event_management_system.repository.SeatRepository;
import com.project.event_management_system.repository.UserRepository;
import com.project.event_management_system.repository.VenueRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final UserRepository userRepository;
    private final SeatRepository seatRepository;
    private final VenueService venueService;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request, Long organizerId) {
        if (request.getEndTime().isBefore(request.getStartTime()) || request.getEndTime().isEqual(request.getStartTime())) {
            throw new BadRequestException("Event end time must be after start time");
        }

        User organizer = userRepository.findById(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("Organizer user not found with id: " + organizerId));

        Venue venue = null;
        if (request.getVenueId() != null) {
            venue = venueRepository.findById(request.getVenueId())
                    .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + request.getVenueId()));
        }

        Event event = Event.builder()
                .organizer(organizer)
                .venue(venue)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .bannerUrl(request.getBannerUrl())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(EventStatus.DRAFT)
                .basePrice(request.getBasePrice())
                .totalSeats(0)
                .availableSeats(0)
                .build();

        Event savedEvent = eventRepository.save(event);

        if (Boolean.TRUE.equals(request.getGenerateSeats())) {
            int rows = (request.getRows() != null && request.getRows() > 0) ? Math.min(request.getRows(), 26) : 8;
            int seatsPerRow = (request.getSeatsPerRow() != null && request.getSeatsPerRow() > 0) ? Math.min(request.getSeatsPerRow(), 50) : 12;

            List<Seat> seats = new ArrayList<>();
            for (int r = 0; r < rows; r++) {
                char rowChar = (char) ('A' + r);
                String rowLabel = String.valueOf(rowChar);
                boolean isVip = r < 2;
                SeatType type = isVip ? SeatType.VIP : SeatType.REGULAR;
                String section = isVip ? "VIP Section" : "Main Hall";
                BigDecimal price = isVip
                        ? request.getBasePrice().multiply(new BigDecimal("1.50")).setScale(2, RoundingMode.HALF_UP)
                        : request.getBasePrice();

                for (int s = 1; s <= seatsPerRow; s++) {
                    String seatNumber = rowLabel + s;
                    seats.add(Seat.builder()
                            .event(savedEvent)
                            .seatNumber(seatNumber)
                            .rowLabel(rowLabel)
                            .section(section)
                            .seatType(type)
                            .price(price)
                            .status(SeatStatus.AVAILABLE)
                            .version(0)
                            .build());
                }
            }

            seatRepository.saveAll(seats);
            savedEvent.setTotalSeats(seats.size());
            savedEvent.setAvailableSeats(seats.size());
            savedEvent = eventRepository.save(savedEvent);
        }

        return mapToResponse(savedEvent);
    }

    @Transactional
    public EventResponse updateEvent(Long eventId, UpdateEventRequest request, Long currentUserId, boolean isAdmin) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        if (!isAdmin && !event.getOrganizer().getId().equals(currentUserId)) {
            throw new BadRequestException("You do not have permission to modify this event");
        }

        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
            throw new BadRequestException("Cannot update an event in " + event.getStatus() + " state");
        }

        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getCategory() != null) event.setCategory(request.getCategory());
        if (request.getBannerUrl() != null) event.setBannerUrl(request.getBannerUrl());
        if (request.getBasePrice() != null) event.setBasePrice(request.getBasePrice());

        if (request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) event.setEndTime(request.getEndTime());

        if (event.getEndTime().isBefore(event.getStartTime()) || event.getEndTime().isEqual(event.getStartTime())) {
            throw new BadRequestException("Event end time must be after start time");
        }

        if (request.getVenueId() != null) {
            Venue venue = venueRepository.findById(request.getVenueId())
                    .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + request.getVenueId()));
            event.setVenue(venue);
        }

        Event updated = eventRepository.save(event);
        return mapToResponse(updated);
    }

    @Transactional
    public EventResponse publishEvent(Long eventId, Long currentUserId, boolean isAdmin) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        if (!isAdmin && !event.getOrganizer().getId().equals(currentUserId)) {
            throw new BadRequestException("You do not have permission to publish this event");
        }

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT events can be published");
        }

        event.setStatus(EventStatus.PUBLISHED);
        Event saved = eventRepository.save(event);
        return mapToResponse(saved);
    }

    @Transactional
    public EventResponse cancelEvent(Long eventId, Long currentUserId, boolean isAdmin) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        if (!isAdmin && !event.getOrganizer().getId().equals(currentUserId)) {
            throw new BadRequestException("You do not have permission to cancel this event");
        }

        event.setStatus(EventStatus.CANCELLED);
        Event saved = eventRepository.save(event);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        return mapToResponse(event);
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> searchEvents(
            String keyword,
            String category,
            String city,
            LocalDateTime startAfter,
            LocalDateTime startBefore,
            Pageable pageable) {

        Specification<Event> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("status"), EventStatus.PUBLISHED));

            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate titlePredicate = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descPredicate = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titlePredicate, descPredicate));
            }

            if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase()));
            }

            if (city != null && !city.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("venue").get("city")), city.trim().toLowerCase()));
            }

            if (startAfter != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), startAfter));
            }

            if (startBefore != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startTime"), startBefore));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return eventRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> getOrganizerEvents(Long organizerId, Pageable pageable) {
        return eventRepository.findByOrganizerId(organizerId, pageable).map(this::mapToResponse);
    }

    public EventResponse mapToResponse(Event event) {
        if (event == null) return null;
        return EventResponse.builder()
                .id(event.getId())
                .organizerId(event.getOrganizer().getId())
                .organizerName(event.getOrganizer().getFullName())
                .organizerEmail(event.getOrganizer().getEmail())
                .venue(venueService.mapToResponse(event.getVenue()))
                .title(event.getTitle())
                .description(event.getDescription())
                .category(event.getCategory())
                .bannerUrl(event.getBannerUrl())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .status(event.getStatus())
                .totalSeats(event.getTotalSeats())
                .availableSeats(event.getAvailableSeats())
                .basePrice(event.getBasePrice())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
