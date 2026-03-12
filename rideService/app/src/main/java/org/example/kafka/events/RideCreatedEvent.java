package org.example.kafka.events;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
    private BigDecimal fare;

}
