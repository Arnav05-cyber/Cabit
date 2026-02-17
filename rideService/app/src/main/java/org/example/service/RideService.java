package org.example.service;

import org.example.dto.request.CreateRideRequest;
import org.example.dto.request.JoinRideRequest;
import org.example.dto.request.LeaveRideRequest;
import org.example.dto.response.RideResponse;
import org.springframework.transaction.annotation.Transactional;

public interface RideService {

    RideResponse createRide(CreateRideRequest request, String userId);
    RideResponse joinRide(JoinRideRequest request, String userId);

    @Transactional
    RideResponse leaveRide(LeaveRideRequest request, String userId);
}
