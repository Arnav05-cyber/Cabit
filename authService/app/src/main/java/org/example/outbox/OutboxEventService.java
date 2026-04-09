package org.example.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.model.UserInfoDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service responsible for writing events to the outbox table.
 * This runs within the SAME transaction as the business logic (user creation),
 * ensuring atomicity — either both the user AND the outbox event are saved,
 * or neither is.
 */
@Service
public class OutboxEventService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public OutboxEventService(OutboxEventRepository outboxEventRepository,
                              ObjectMapper objectMapper) {
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Writes a UserInfoDto as a PENDING outbox event.
     * Must be called within an active @Transactional context.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void saveUserEvent(UserInfoDto userInfoDto) {
        try {
            String payload = objectMapper.writeValueAsString(userInfoDto);

            OutboxEvent event = OutboxEvent.builder()
                    .id(UUID.randomUUID().toString())
                    .aggregateType("UserInfo")
                    .aggregateId(userInfoDto.getUserId())
                    .payload(payload)
                    .status(OutboxEvent.OutboxStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();

            outboxEventRepository.save(event);
            System.out.println("[Outbox] Saved PENDING event for user: " + userInfoDto.getUserName());

        } catch (Exception e) {
            throw new RuntimeException("Failed to write outbox event for user: " + userInfoDto.getUserName(), e);
        }
    }
}
