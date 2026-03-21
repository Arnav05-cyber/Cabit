package org.example.entities;

import jakarta.persistence.*;
import lombok.*;
import org.example.enums.RideStatus;


import java.time.LocalDateTime;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "rides", indexes = {
        @Index(name = "idx_ride_status", columnList = "ride_status"),
        @Index(name = "idx_departure_time", columnList = "departure_time")
})
@Getter
@Setter
public class Ride {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ride_id")
    private String rideId;

    @Version
    private Long version;

    @Column(name = "creater_id")
    private String createrId;

    @Column(name = "from_location")
    private String fromLocation;

    @Column(name = "to_location")
    private String toLocation;

    @Column(name = "from_lat")
    private Double fromLat;

    @Column(name = "from_lng")
    private Double fromLng;

    @Column(name = "to_lat")
    private Double toLat;

    @Column(name = "to_lng")
    private Double toLng;

    @Column(name = "route_polyline", columnDefinition = "TEXT")
    private String routePolyline;

    @Column(name = "departure_time")
    private LocalDateTime departureTime;

    @Column(name = "total_seats")
    private Integer totalSeats;

    @Column(name = "seats_available")
    private Integer seatsAvailable;

    @Enumerated(EnumType.STRING)
    @Column(name = "ride_status")
    private RideStatus rideStatus;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

}