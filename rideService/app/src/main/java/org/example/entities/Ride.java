package org.example.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "rides")
@Getter
@Setter
public class Ride {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ride_id")
    private String rideId;

    @Column(name = "creater_id")
    private String createrId;

    @Column(name = "from_location")
    private String fromLocation;

    @Column(name = "to_location")
    private String toLocation;

    @Column(name = "departure_time")
    private LocalDateTime departureTime;

    @Column(name = "totalFare")
    private BigDecimal fare;

    @Column(name = "total_seats")
    private Integer totalSeats;

    @Column(name = "seats_available")
    private Integer seatsAvailable;

    @Column(name = "ride_status")
    private String rideStatus;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "ride", cascade = CascadeType.ALL)

    private java.util.Set<RideBookings> bookings = new java.util.HashSet<>();

}