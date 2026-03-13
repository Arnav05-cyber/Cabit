package org.example.kafka.listener;

import lombok.extern.slf4j.Slf4j;
import org.example.kafka.events.RideCreatedEvent;
import org.example.kafka.events.RideJoinedEvent;
import org.example.kafka.events.RideLeftEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@KafkaListener(topics = "ride-events", groupId = "cabit-notification-group")
public class NotificationListener {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @KafkaHandler
    public void handleRideCreated(RideCreatedEvent rideCreatedEvent) {
        log.info("🔔 [NEW RIDE] User {} created a ride from {} to {} at {}",
                rideCreatedEvent.getCreatorId(),
                rideCreatedEvent.getFromLocation(),
                rideCreatedEvent.getToLocation(),
                rideCreatedEvent.getDepartureTime());

        simpMessagingTemplate.convertAndSend("/topic/ride-updates", "New ride created from " + rideCreatedEvent.getFromLocation() + " to " + rideCreatedEvent.getToLocation());
    }


    @KafkaHandler
    public void handleRideJoined(RideJoinedEvent rideJoinedEvent) {
        log.info("🔔 [NEW RIDE] User {} joined a ride {} at {} and booked {} seats",
                rideJoinedEvent.getUserId(),
                rideJoinedEvent.getRideId(),
                rideJoinedEvent.getJoinedAt(),
                rideJoinedEvent.getSeatsBooked());

        simpMessagingTemplate.convertAndSend("/topic/ride-updates", "User " + rideJoinedEvent.getUserId() + " joined ride " + rideJoinedEvent.getRideId());
    }

    @KafkaHandler
    public void handleRideLeft(RideLeftEvent  rideLeftEvent) {
        log.info("🔔 [RIDE LEFT] User {} left a ride {} at {}",
                rideLeftEvent.getUserId(),
                rideLeftEvent.getRideId(),
                rideLeftEvent.getLeftAt());

        simpMessagingTemplate.convertAndSend("/topic/ride-updates", "User " + rideLeftEvent.getUserId() + " left ride " + rideLeftEvent.getRideId());
    }

}
