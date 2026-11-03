package com.project.event_management_system.repository;

import com.project.event_management_system.model.Event;
import com.project.event_management_system.model.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    Page<Event> findByOrganizerId(Long organizerId, Pageable pageable);

    List<Event> findByOrganizerId(Long organizerId);

    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    Optional<Event> findByIdAndOrganizerId(Long id, Long organizerId);

    long countByOrganizerId(Long organizerId);

    long countByOrganizerIdAndStatus(Long organizerId, EventStatus status);

    long countByStatus(EventStatus status);
}
