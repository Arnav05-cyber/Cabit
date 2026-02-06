package org.example.service;

import org.springframework.transaction.annotation.Transactional;
import org.example.dto.request.CreateRideRequest;
import org.example.dto.request.JoinRideRequest;
import org.example.dto.response.RideResponse;
import org.example.entities.Ride;
import org.example.repos.RideBookingsRepo;
import org.example.repos.RideRepo;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
public class RideServiceImpl implements RideService{

    private final RideRepo rideRepo;
    private final RideBookingsRepo rideBookingsRepo;

    public RideServiceImpl(RideRepo rideRepo, RideBookingsRepo rideBookingsRepo) {
        this.rideRepo = rideRepo;
        this.rideBookingsRepo = rideBookingsRepo;
    }


    @Override
    public RideResponse createRide(CreateRideRequest request, String userId) {
        Ride ride = new Ride();

        ride.setFromLocation(request.getFromLocation());
        ride.setToLocation(request.getToLocation());
        ride.setDepartureTime(request.getDepartureTime());
        ride.setTotalSeats(request.getTotalSeats());
        ride.setSeatsAvailable(request.getTotalSeats());
        ride.setFare(request.getTotalFare());

        ride.setCreaterId(userId);

        ride.setRideStatus("OPEN");

        ride.setCreatedAt(LocalDateTime.now());

        Ride savedRide = rideRepo.save(ride);

        BigDecimal farePerPerson =  savedRide.getFare().divide(BigDecimal.valueOf(savedRide.getTotalSeats()), RoundingMode.HALF_UP);

        return new RideResponse(
                savedRide.getRideId(),
                savedRide.getToLocation(),
                savedRide.getFromLocation(),
                savedRide.getDepartureTime(),
                savedRide.getSeatsAvailable(),
                savedRide.getFare(),
                savedRide.getRideStatus(),
                farePerPerson
        );
    }

    @Override
    @Transactional
    public RideResponse joinRide(JoinRideRequest request, String userId) {

        Ride ride = rideRepo.findById(request.getRideId()).orElseThrow(() -> new RuntimeException("Ride not found"));

        if(ride.getSeatsAvailable() <= 0) {
            throw new RuntimeException("No seats available");
        }

        if(rideBookingsRepo.findByRideAndUserId(ride, userId).isPresent()) {
            throw new RuntimeException("User already joined this ride");
        }

        if(ride.getCreaterId().equals(userId)) {
            throw new RuntimeException("Ride creator cannot join their own ride");
        }

        if(ride.getRideStatus().equals("CLOSED")) {
            throw new RuntimeException("Cannot join a closed ride");
        }


    }

}
