package org.example.repos;

import org.example.entities.Ride;
import org.example.enums.RideStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RideRepo extends JpaRepository<Ride, String> {

    Page<Ride> findByToLocation(String toLocation, Pageable pageable);

    Page<Ride> findBySeatsAvailableGreaterThan(Integer seatsAvailable, Pageable pageable);

    Page<Ride> findByToLocationAndSeatsAvailableGreaterThan(
            String toLocation,
            Integer seatsAvailable,
            Pageable pageable
    );

    Page<Ride> findByDepartureTimeAfter(LocalDateTime time, Pageable pageable);

    Page<Ride> findByDepartureTimeBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Ride> findByDepartureTimeBefore(LocalDateTime time, Pageable pageable);

    @Query("SELECT r FROM Ride r WHERE r.rideStatus = :status AND r.seatsAvailable > 0 AND r.departureTime > :now")
    List<Ride> findUpcomingAvailableRides(@Param("status") RideStatus status, @Param("now") LocalDateTime now);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Ride r SET r.seatsAvailable = r.seatsAvailable - 1 WHERE r.rideId = :rideId AND r.seatsAvailable > 0")
    int decrementSeatsAvailable(@org.springframework.data.repository.query.Param("rideId") String rideId);

    Page<Ride> findByCreaterId(String createrId, Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Ride r WHERE r.departureTime < :time")
    void deleteAllByDepartureTimeBefore(@org.springframework.data.repository.query.Param("time") LocalDateTime time);
}
