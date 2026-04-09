package org.example.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.model.UserInfoDto;
import org.example.eventProducer.UserInfoProducer;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled poller that picks up PENDING outbox events and publishes them to Kafka.
 *
 * This is the second half of the Transactional Outbox Pattern.
 * It runs every 5 seconds, finds all PENDING rows, sends them to Kafka,
 * and marks them PUBLISHED on success (or FAILED if Kafka is down).
 *
 * Because this runs in a separate transaction from the user creation,
 * it is guaranteed that by the time it reads PENDING rows, they are
 * already fully committed to the DB.
 */
@Component
public class OutboxPoller {

    private final OutboxEventRepository outboxEventRepository;
    private final UserInfoProducer userInfoProducer;
    private final ObjectMapper objectMapper;

    public OutboxPoller(OutboxEventRepository outboxEventRepository,
                        UserInfoProducer userInfoProducer,
                        ObjectMapper objectMapper) {
        this.outboxEventRepository = outboxEventRepository;
        this.userInfoProducer = userInfoProducer;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelay = 5000) // runs every 5 seconds
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> pendingEvents =
                outboxEventRepository.findByStatusOrderByCreatedAtAsc(OutboxEvent.OutboxStatus.PENDING);

        if (pendingEvents.isEmpty()) return;

        System.out.println("[OutboxPoller] Found " + pendingEvents.size() + " PENDING event(s) to publish...");

        for (OutboxEvent event : pendingEvents) {
            try {
                UserInfoDto dto = objectMapper.readValue(event.getPayload(), UserInfoDto.class);

                userInfoProducer.sendEvent(dto);

                event.setStatus(OutboxEvent.OutboxStatus.PUBLISHED);
                event.setPublishedAt(LocalDateTime.now());
                outboxEventRepository.save(event);

                System.out.println("[OutboxPoller] PUBLISHED event for aggregateId: " + event.getAggregateId());

            } catch (Exception e) {
                event.setStatus(OutboxEvent.OutboxStatus.FAILED);
                outboxEventRepository.save(event);
                System.err.println("[OutboxPoller] FAILED to publish event: " + event.getId()
                        + " | Reason: " + e.getMessage());
            }
        }
    }
}
