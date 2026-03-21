package org.example.kafka.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.geo.LatLang;
import org.example.service.GeocodingService;
import org.example.service.RedisGeoService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class UserInfoConsumer {

    private final RedisGeoService redisGeoService;
    private final GeocodingService geocodingService;
    private final ObjectMapper objectMapper;

    public UserInfoConsumer(RedisGeoService redisGeoService, GeocodingService geocodingService, ObjectMapper objectMapper) {
        this.redisGeoService = redisGeoService;
        this.geocodingService = geocodingService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "userEvents", groupId = "ride-service-user-events")
    public void consumeUserEvent(String message) {
        try {
            JsonNode jsonNode = objectMapper.readTree(message);
            String userId = jsonNode.has("userId") ? jsonNode.get("userId").asText() : null;
            String place1 = jsonNode.has("place1") && !jsonNode.get("place1").isNull() ? jsonNode.get("place1").asText() : null;
            String place2 = jsonNode.has("place2") && !jsonNode.get("place2").isNull() ? jsonNode.get("place2").asText() : null;

            if (userId != null) {
                String firstName = jsonNode.has("firstName") && !jsonNode.get("firstName").isNull() ? jsonNode.get("firstName").asText() : "";
                String lastName = jsonNode.has("lastName") && !jsonNode.get("lastName").isNull() ? jsonNode.get("lastName").asText() : "";
                String name = (firstName + " " + lastName).trim();
                String phoneNumber = jsonNode.has("phoneNumber") && !jsonNode.get("phoneNumber").isNull() ? jsonNode.get("phoneNumber").asText() : null;

                redisGeoService.saveUserInfo(userId, name.isEmpty() ? null : name, phoneNumber);

                if (place1 != null && !place1.trim().isEmpty()) {
                    LatLang loc1 = geocodingService.geocode(place1);
                    if (loc1 != null) {
                        redisGeoService.addUserLocation(userId, loc1, 1);
                    }
                }
                if (place2 != null && !place2.trim().isEmpty()) {
                    LatLang loc2 = geocodingService.geocode(place2);
                    if (loc2 != null) {
                        redisGeoService.addUserLocation(userId, loc2, 2);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error processing user event in RideService: {}", e.getMessage(), e);
        }
    }
}
