package org.example.kafka.events;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class RideJoinedEvent {

    private String rideId;
    private String userId;
    private Integer seatsBooked;
    private LocalDateTime joinedAt;

}
