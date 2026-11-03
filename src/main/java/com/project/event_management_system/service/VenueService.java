package com.project.event_management_system.service;

import com.project.event_management_system.dto.VenueRequest;
import com.project.event_management_system.dto.VenueResponse;
import com.project.event_management_system.exception.ResourceNotFoundException;
import com.project.event_management_system.model.Venue;
import com.project.event_management_system.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VenueService {

    private final VenueRepository venueRepository;

    @Transactional
    public VenueResponse createVenue(VenueRequest request) {
        Venue venue = Venue.builder()
                .name(request.getName())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .capacity(request.getCapacity())
                .build();

        Venue saved = venueRepository.save(venue);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<VenueResponse> getAllVenues() {
        return venueRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VenueResponse getVenueById(Long id) {
        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + id));
        return mapToResponse(venue);
    }

    public VenueResponse mapToResponse(Venue venue) {
        if (venue == null) return null;
        return VenueResponse.builder()
                .id(venue.getId())
                .name(venue.getName())
                .address(venue.getAddress())
                .city(venue.getCity())
                .state(venue.getState())
                .postalCode(venue.getPostalCode())
                .capacity(venue.getCapacity())
                .createdAt(venue.getCreatedAt())
                .build();
    }
}
