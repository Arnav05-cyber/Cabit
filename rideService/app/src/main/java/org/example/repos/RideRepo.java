package org.example.repos;

import org.example.entities.Ride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;

public interface RideRepo extends JpaRepository<Ride, String> {
    public List<Ride> findByRideStatus(String rideStatus);
    public List<Ride> findByToLocation(String toLocation);
    public List<Ride> findBySeatsAvailableGreaterThan(Integer seatsAvailable);
    public List<Ride> findByFareLessThanAndToLocation(BigDecimal fare, String toLocation);
    public List<Ride> findByToLocationAndRideStatus(String toLocation, String rideStatus);
    public List<Ride> findByToLocationAndSeatsAvailableGreaterThan(String toLocation, Integer seatsAvailable);

}
