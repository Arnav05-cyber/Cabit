package org.example.kafka.producer;

import org.example.kafka.events.RideCreatedEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class RideEventProducer {
    private final KafkaTemplate<String, RideCreatedEvent> kafkaTemplate;


    public RideEventProducer(KafkaTemplate<String, RideCreatedEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishRideCreatedEvent(RideCreatedEvent rideCreatedEvent) {
        kafkaTemplate.send("ride-events", rideCreatedEvent.getRideId(), rideCreatedEvent);
    }
}
