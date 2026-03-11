package org.example.controller;

import lombok.AllArgsConstructor;
import org.example.dto.request.CreateRideRequest;
import org.example.dto.request.JoinRideRequest;
import org.example.dto.request.LeaveRideRequest;
import org.example.dto.response.RideResponse;


import org.example.entities.Ride;
import org.example.service.RideService;


import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/rides")
public class RideController {


    private final RideService rideService;

    @PostMapping
    public RideResponse createRide(@Valid @RequestBody CreateRideRequest rideRequest, Authentication authentication){
        String username = authentication.getName();

        RideResponse ride = rideService.createRide(rideRequest, username);

        return ride;
    }

    @PostMapping("/{rideId}/join")
    public RideResponse joinRide(@PathVariable String rideId, Authentication authentication){
        JoinRideRequest request = new JoinRideRequest(rideId);
        String username = authentication.getName();
        RideResponse ride = rideService.joinRide(request, username);
        return ride;
    }

    @PostMapping("/{rideId}/leave")
    public RideResponse leaveRide(@PathVariable String rideId, Authentication authentication){
        LeaveRideRequest request = new LeaveRideRequest(rideId);
        String username = authentication.getName();
        RideResponse ride = rideService.leaveRide(request, username);
        return ride;
    }

    @GetMapping("/{rideId}")
    public RideResponse getRide(@PathVariable String rideId){
        RideResponse ride = rideService.getRide(rideId);
        return ride;
    }

    @GetMapping("/getAllRides")
    public List<RideResponse> getAllRides(){
        return rideService.getAllRides();
    }


}
