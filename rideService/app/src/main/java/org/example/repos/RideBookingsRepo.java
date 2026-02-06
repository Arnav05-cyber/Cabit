package org.example.repos;

import org.example.entities.Ride;
import org.example.entities.RideBookings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RideBookingsRepo extends JpaRepository<RideBookings, String> {

    Optional<RideBookings> findByRideAndUserId(Ride ride, String userId);

}
