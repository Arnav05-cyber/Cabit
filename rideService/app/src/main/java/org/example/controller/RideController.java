package org.example.controller;

import lombok.AllArgsConstructor;
import org.example.dto.request.CreateRideRequest;
import org.example.dto.response.RideResponse;



import org.example.service.RideService;


import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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

    @PutMapping("/{rideId}/close")
    public RideResponse closeRide(@PathVariable String rideId, Authentication authentication) {
        String username = authentication.getName();
        return rideService.closeRide(rideId, username);
    }

    @DeleteMapping("/{rideId}")
    public void deleteRide(@PathVariable String rideId, Authentication authentication) {
        String username = authentication.getName();
        rideService.deleteRide(rideId, username);
    }
    @GetMapping("/{rideId}")
    public RideResponse getRide(@PathVariable String rideId){
        RideResponse ride = rideService.getRide(rideId);
        return ride;
    }


    @GetMapping("/my/offered")
    public Page<RideResponse> getMyOfferedRides(Authentication authentication, Pageable pageable) {
        String username = authentication.getName();
        return rideService.getMyOfferedRides(username, pageable);
    }



    @GetMapping
    public Page<RideResponse> getRides(
            @RequestParam(required = false) String toLocation,
            @RequestParam(required = false) Boolean availableSeats,
            @RequestParam(required = false) LocalDateTime after,
            @RequestParam(required = false) LocalDateTime before,
            Pageable pageable
    ){
        return rideService.getRides(toLocation, availableSeats, before, after, pageable);
    }

    @GetMapping("/match")
    public List<RideResponse> matchRides(
            @RequestParam String from,
            @RequestParam String to
    ) {
        return rideService.matchRides(from, to);
    }

    @GetMapping("/nearby")
    public List<RideResponse> getNearbyRides(Authentication authentication) {
        String username = authentication.getName();
        return rideService.getNearbyRides(username);
    }




}
