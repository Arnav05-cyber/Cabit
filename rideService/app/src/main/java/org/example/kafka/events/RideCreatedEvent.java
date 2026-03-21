package org.example.kafka.events;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RideCreatedEvent {

    private String rideId;
    private String creatorId;
    private String fromLocation;
    private String toLocation;
    private LocalDateTime departureTime;
    private Integer totalSeats;
    private List<String> nearbyUserIds;

}
