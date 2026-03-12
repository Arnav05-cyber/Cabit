package org.example.service;

import org.example.dto.request.LeaveRideRequest;
import org.example.entities.RideBookings;
import org.example.enums.RideStatus;
import org.example.geo.LatLang;
import org.example.kafka.events.RideCreatedEvent;
import org.example.kafka.producer.RideEventProducer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.transaction.annotation.Transactional;
import org.example.dto.request.CreateRideRequest;
import org.example.dto.request.JoinRideRequest;
import org.example.dto.response.RideResponse;
import org.example.entities.Ride;
import org.example.exception.*;
import org.example.repos.RideBookingsRepo;
import org.example.repos.RideRepo;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Service
public class RideServiceImpl implements RideService{

    private final RideRepo rideRepo;
    private final RideBookingsRepo rideBookingsRepo;
    private final GeocodingService  geocodingService;
    private final RoutingService routingService;
    private final RouteMatchingService routeMatchingService;
    private final RideEventProducer rideEventProducer;


    public RideServiceImpl(RideRepo rideRepo, RideBookingsRepo rideBookingsRepo,  GeocodingService geocodingService, RoutingService routingService,  RouteMatchingService routeMatchingService, RideEventProducer rideEventProducer) {
        this.rideRepo = rideRepo;
        this.rideBookingsRepo = rideBookingsRepo;
        this.geocodingService = geocodingService;
        this.routingService = routingService;
        this.routeMatchingService = routeMatchingService;
        this.rideEventProducer = rideEventProducer;
    }


    private BigDecimal calculateFarePerPerson(Ride ride) {
        if (ride.getTotalSeats() == null || ride.getTotalSeats() <= 0) {
            return ride.getFare();
        }
        return ride.getFare().divide(BigDecimal.valueOf(ride.getTotalSeats()), RoundingMode.HALF_UP);
    }

    @Override
    public RideResponse createRide(CreateRideRequest request, String userId) {
        Ride ride = new Ride();

        LatLang start = geocodingService.geocode(request.getFromLocation());
        LatLang end = geocodingService.geocode(request.getToLocation());

        String polyline = routingService.getRoutePolyline(start, end);

        ride.setRoutePolyline(polyline);

        ride.setFromLocation(request.getFromLocation());
        ride.setToLocation(request.getToLocation());
        ride.setDepartureTime(request.getDepartureTime());
        ride.setTotalSeats(request.getTotalSeats());
        ride.setSeatsAvailable(request.getTotalSeats());
        ride.setFare(request.getTotalFare());

        ride.setCreaterId(userId);

        ride.setRideStatus(RideStatus.OPEN);

        ride.setCreatedAt(LocalDateTime.now());

        Ride savedRide = rideRepo.save(ride);

        RideCreatedEvent event = new  RideCreatedEvent(
                savedRide.getRideId(),
                savedRide.getCreaterId(),
                savedRide.getFromLocation(),
                savedRide.getToLocation(),
                savedRide.getDepartureTime(),
                savedRide.getTotalSeats(),
                savedRide.getFare()
        );

        rideEventProducer.publishRideCreatedEvent(event);

        BigDecimal farePerPerson = calculateFarePerPerson(savedRide);

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

        Ride ride = rideRepo.findById(request.getRideId()).orElseThrow(() -> new RideNotFoundException("Ride not found"));

        if(ride.getSeatsAvailable() <= 0) {
            throw new NoSeatsAvailableException("No seats available");
        }

        if(rideBookingsRepo.findByRideAndUserId(ride, userId).isPresent()) {
            throw new UserAlreadyJoinedException("User already joined this ride");
        }

        if(ride.getCreaterId().equals(userId)) {
            throw new InvalidRideActionException("Ride creator cannot join their own ride");
        }

        if (!RideStatus.OPEN.equals(ride.getRideStatus())) {
            throw new InvalidRideActionException("Ride is not open for joining");
        }

        int updatedRows = rideRepo.decrementSeatsAvailable(ride.getRideId());
        if (updatedRows == 0) {
            throw new NoSeatsAvailableException("No seats available");
        }
        ride.setSeatsAvailable(ride.getSeatsAvailable() - 1);

        BigDecimal farePerPerson = calculateFarePerPerson(ride);

        RideBookings booking = new RideBookings();

        booking.setRide(ride);
        booking.setUserId(userId);
        booking.setJoinedAt(LocalDateTime.now());
        booking.setFareShare(farePerPerson);
        booking.setSeatsBooked(1);

        rideBookingsRepo.save(booking);

        if (ride.getSeatsAvailable() == 0) {
            ride.setRideStatus(RideStatus.FULL);
            rideRepo.save(ride);
        }

        return new RideResponse(
                ride.getRideId(),
                ride.getToLocation(),
                ride.getFromLocation(),
                ride.getDepartureTime(),
                ride.getSeatsAvailable(),
                ride.getFare(),
                ride.getRideStatus(),
                farePerPerson
        );
    }


    @Transactional
    @Override
    public RideResponse leaveRide(LeaveRideRequest request, String userId){
        Ride ride = rideRepo.findById(request.getRideId()).orElseThrow(() -> new RideNotFoundException("Ride not found"));

        RideBookings booking = rideBookingsRepo.findByRideAndUserId(ride, userId).orElseThrow(() -> new InvalidRideActionException("Booking not found"));

        rideBookingsRepo.delete(booking);

        ride.setSeatsAvailable(ride.getSeatsAvailable() + 1);

        if(RideStatus.FULL.equals(ride.getRideStatus())) {
            ride.setRideStatus(RideStatus.OPEN);
        }

        BigDecimal farePerPerson = calculateFarePerPerson(ride);

        rideRepo.save(ride);

        return new RideResponse(
                ride.getRideId(),
                ride.getToLocation(),
                ride.getFromLocation(),
                ride.getDepartureTime(),
                ride.getSeatsAvailable(),
                ride.getFare(),
                ride.getRideStatus(),
                farePerPerson
        );
    }

    @Override
    public RideResponse getRide(String rideId) {
         Ride ride = rideRepo.findById(rideId).orElseThrow(() -> new RideNotFoundException("Ride not found"));

        BigDecimal farePerPerson = calculateFarePerPerson(ride);

        return new RideResponse(
                ride.getRideId(),
                ride.getToLocation(),
                ride.getFromLocation(),
                ride.getDepartureTime(),
                ride.getSeatsAvailable(),
                ride.getFare(),
                ride.getRideStatus(),
                farePerPerson
        );
    }


    @Override
    public Page<RideResponse> getAllRides(Pageable pageable) {
        return rideRepo.findAll(pageable).map(
                ride -> new RideResponse(
                        ride.getRideId(),
                        ride.getToLocation(),
                        ride.getFromLocation(),
                        ride.getDepartureTime(),
                        ride.getSeatsAvailable(),
                        ride.getFare(),
                        ride.getRideStatus(),
                        calculateFarePerPerson(ride)
                )
        );
    }

    @Override
    public Page<RideResponse> getRides(
            String toLocation,
            Boolean availableSeats,
            LocalDateTime before,
            LocalDateTime after,
            Pageable pageable
    ) {

        Page<Ride> rides;

        if (before != null && after != null) {
            rides = rideRepo.findByDepartureTimeBetween(after, before, pageable);
        }
        else if (before != null) {
            rides = rideRepo.findByDepartureTimeBefore(before, pageable);
        }
        else if (after != null) {
            rides = rideRepo.findByDepartureTimeAfter(after, pageable);
        }
        else if (toLocation != null && Boolean.TRUE.equals(availableSeats)) {
            rides = rideRepo.findByToLocationAndSeatsAvailableGreaterThan(toLocation, 0, pageable);
        }
        else if (toLocation != null) {
            rides = rideRepo.findByToLocation(toLocation, pageable);
        }
        else if (Boolean.TRUE.equals(availableSeats)) {
            rides = rideRepo.findBySeatsAvailableGreaterThan(0, pageable);
        }
        else {
            rides = rideRepo.findAll(pageable);
        }

        return rides.map(ride -> new RideResponse(
                ride.getRideId(),
                ride.getToLocation(),
                ride.getFromLocation(),
                ride.getDepartureTime(),
                ride.getSeatsAvailable(),
                ride.getFare(),
                ride.getRideStatus(),
                calculateFarePerPerson(ride)
        ));
    }

    public List<RideResponse> matchRides(String fromLocation, String toLocation) {

        LatLang destination = geocodingService.geocode(toLocation);

        List<Ride> rides = rideRepo.findUpcomingAvailableRides(RideStatus.OPEN, LocalDateTime.now());

        List<RideResponse> matches = new ArrayList<>();

        for (Ride ride : rides) {

            boolean match = routeMatchingService.isDestinationNearRoute(
                    ride.getRoutePolyline(),
                    destination
            );

            if (match) {

                matches.add(
                        new RideResponse(
                                ride.getRideId(),
                                ride.getToLocation(),
                                ride.getFromLocation(),
                                ride.getDepartureTime(),
                                ride.getSeatsAvailable(),
                                ride.getFare(),
                                ride.getRideStatus(),
                                calculateFarePerPerson(ride)
                        )
                );
            }
        }

        return matches;
    }
}
