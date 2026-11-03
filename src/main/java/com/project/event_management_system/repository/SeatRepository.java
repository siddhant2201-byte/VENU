package com.project.event_management_system.repository;

import com.project.event_management_system.model.Seat;
import com.project.event_management_system.model.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {

    List<Seat> findByEventIdOrderByRowLabelAscSeatNumberAsc(Long eventId);

    List<Seat> findByEventIdAndIdIn(Long eventId, List<Long> seatIds);

    long countByEventIdAndStatus(Long eventId, SeatStatus status);

    void deleteByEventId(Long eventId);
}
