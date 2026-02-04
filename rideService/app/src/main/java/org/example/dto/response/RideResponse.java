package org.example.dto.response;


import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RideResponse {


    private String rideId;


    private String toLocation;


    private String fromLocation;


    private LocalDateTime departureTime;


    private Integer seatsAvailable;


    private BigDecimal totalFare;

    private String rideStatus;

    private BigDecimal farePerPerson;

}
