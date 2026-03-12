package org.example.service;

import org.example.dto.request.CreateRideRequest;
import org.example.dto.request.JoinRideRequest;
import org.example.dto.request.LeaveRideRequest;
import org.example.dto.response.RideResponse;
import org.example.entities.Ride;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface RideService {

    RideResponse createRide(CreateRideRequest request, String userId);
    RideResponse joinRide(JoinRideRequest request, String userId);

    @Transactional
    RideResponse leaveRide(LeaveRideRequest request, String userId);

    RideResponse getRide(String rideId);

    Page<RideResponse> getAllRides(Pageable pageable);

    Page<RideResponse> getRides(String toLocation, Boolean availableSeats, LocalDateTime before, LocalDateTime after ,Pageable pageable);

    List<RideResponse> matchRides(String fromLocation, String toLocation);
}
