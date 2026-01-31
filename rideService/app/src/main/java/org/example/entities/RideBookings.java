package org.example.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "ride_bookings")
@Getter
@Setter
public class RideBookings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name="booking_id")
    private String bookingId;

    @Column(name="user_id")
    private String userId;

    @Column(name = "fare_share")
    private BigDecimal fareShare;

    @Column(name = "seats_booked")
    private Integer seatsBooked;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @ManyToOne
    @JoinColumn(name = "ride_id")
    private Ride ride;

}
