package org.example.dto.response;


import lombok.*;
import org.example.enums.RideStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RideResponse {


    private String rideId;

    private String createrId;


    private String toLocation;


    private String fromLocation;


    private LocalDateTime departureTime;


    private Integer seatsAvailable;


    private BigDecimal totalFare;

    private RideStatus rideStatus;

    private BigDecimal farePerPerson;

}
