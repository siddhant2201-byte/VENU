package com.project.event_management_system.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.event_management_system.config.KafkaTopicConfig;
import com.project.event_management_system.dto.BookingConfirmedEvent;
import com.project.event_management_system.model.OutboxEvent;
import com.project.event_management_system.model.OutboxStatus;
import com.project.event_management_system.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxPublisherService {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    private static final int MAX_RETRIES = 5;

    @Scheduled(fixedDelay = 2000)
    public void publishPendingOutboxEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository.findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
        if (pendingEvents.isEmpty()) {
            return;
        }

        log.debug("Found {} pending outbox event(s) to publish to Kafka", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            publishSingleEvent(event);
        }
    }

    @Transactional
    public void publishSingleEvent(OutboxEvent event) {
        try {

            BookingConfirmedEvent eventDto = objectMapper.readValue(event.getPayload(), BookingConfirmedEvent.class);

            kafkaTemplate.send(KafkaTopicConfig.BOOKING_EVENTS_TOPIC, event.getAggregateId(), eventDto)
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            event.setStatus(OutboxStatus.PUBLISHED);
                            event.setPublishedAt(LocalDateTime.now());
                            outboxEventRepository.save(event);
                            log.info("Outbox event {} published to Kafka topic {} [partition: {}, offset: {}]",
                                    event.getId(),
                                    result.getRecordMetadata().topic(),
                                    result.getRecordMetadata().partition(),
                                    result.getRecordMetadata().offset());
                        } else {
                            handlePublishFailure(event, ex);
                        }
                    });

        } catch (Exception e) {
            handlePublishFailure(event, e);
        }
    }

    private void handlePublishFailure(OutboxEvent event, Throwable ex) {
        int currentRetries = event.getRetryCount() + 1;
        event.setRetryCount(currentRetries);
        event.setErrorMessage(ex != null ? ex.getMessage() : "Unknown Kafka publishing error");

        if (currentRetries >= MAX_RETRIES) {
            event.setStatus(OutboxStatus.FAILED);
            log.error("Outbox event {} exceeded maximum retries ({}). Marked as FAILED.",
                    event.getId(), MAX_RETRIES, ex);
        } else {
            log.warn("Failed to publish outbox event {} (attempt {}/{}). Will retry on next cycle.",
                    event.getId(), currentRetries, MAX_RETRIES, ex);
        }

        outboxEventRepository.save(event);
    }
}
