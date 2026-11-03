package com.project.event_management_system.consumer;

import com.project.event_management_system.config.KafkaTopicConfig;
import com.project.event_management_system.dto.BookingConfirmedEvent;
import com.project.event_management_system.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(
            topics = KafkaTopicConfig.BOOKING_EVENTS_TOPIC,
            groupId = "${spring.kafka.consumer.group-id:ems-group}"
    )
    public void handleBookingConfirmed(BookingConfirmedEvent event) {
        log.info("Kafka consumer received BOOKING_CONFIRMED event for reference: {} (User: {})",
                event.getBookingReference(), event.getUserEmail());

        try {
            notificationService.sendBookingConfirmationEmail(event);
        } catch (Exception e) {
            log.error("Error processing booking confirmation event for reference {}",
                    event.getBookingReference(), e);
        }
    }
}
