package org.example.kafka.events;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;


import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class RideCreatedEvent {

    private String rideId;
    private String creatorId;
    private String fromLocation;
    private String toLocation;
    private LocalDateTime departureTime;
    private Integer totalSeats;
    private List<String> nearbyUserIds;
}
