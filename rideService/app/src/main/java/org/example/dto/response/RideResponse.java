package org.example.dto.response;


import lombok.*;
import org.example.enums.RideStatus;


import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RideResponse {


    private String rideId;

    private String createrId;

    private String creatorName;

    private String creatorPhone;


    private String toLocation;


    private String fromLocation;


    private LocalDateTime departureTime;


    private Integer seatsAvailable;

    private RideStatus rideStatus;

}
