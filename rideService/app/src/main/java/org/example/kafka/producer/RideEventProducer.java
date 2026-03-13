package org.example.kafka.producer;

import org.example.kafka.events.RideCreatedEvent;
import org.example.kafka.events.RideJoinedEvent;
import org.example.kafka.events.RideLeftEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class RideEventProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public RideEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishRideCreatedEvent(RideCreatedEvent rideCreatedEvent) {
        kafkaTemplate.send("ride-events", rideCreatedEvent.getRideId(), rideCreatedEvent);
    }

    public void publishRideJoinedEvent(RideJoinedEvent rideJoinedEvent) {
        kafkaTemplate.send("ride-events", rideJoinedEvent.getRideId(), rideJoinedEvent);
    }

    public void  publishRideLeftEvent(RideLeftEvent rideLeftEvent) {
        kafkaTemplate.send("ride-events", rideLeftEvent.getRideId(), rideLeftEvent);
    }
}
