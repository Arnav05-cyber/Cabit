package org.example.kafka.events;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
    private BigDecimal fare;

}
