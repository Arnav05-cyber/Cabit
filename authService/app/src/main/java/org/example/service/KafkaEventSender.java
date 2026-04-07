package org.example.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.example.eventProducer.UserInfoProducer;
import org.example.model.UserInfoDto;
import org.springframework.stereotype.Component;

@Component
public class KafkaEventSender {

    private final UserInfoProducer userInfoProducer;

    public KafkaEventSender(UserInfoProducer userInfoProducer) {
        this.userInfoProducer = userInfoProducer;
    }

    @CircuitBreaker(name = "kafkaProducer", fallbackMethod = "kafkaFallback")
    public boolean trySendingEvent(UserInfoDto userInfoDto) {
        userInfoProducer.sendEvent(userInfoDto);
        System.out.println("EVENT SENT TO KAFKA: " + userInfoDto.getUserName());
        return true;
    }

    public boolean kafkaFallback(UserInfoDto userInfoDto, Throwable t) {
        System.err.println("Kafka circuit open — skipping event for: "
                + userInfoDto.getUserName() + " | Reason: " + t.getMessage());
        return false;
    }
}
