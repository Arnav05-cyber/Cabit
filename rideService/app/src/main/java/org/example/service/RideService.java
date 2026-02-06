package org.example.service;

import org.example.dto.request.CreateRideRequest;
import org.example.dto.request.JoinRideRequest;
import org.example.dto.response.RideResponse;

public interface RideService {

    RideResponse createRide(CreateRideRequest request, String userId);
    RideResponse joinRide(JoinRideRequest request, String userId);
}
