package org.example.service;

import lombok.extern.slf4j.Slf4j;
import org.example.dto.request.LeaveRideRequest;
import org.example.enums.RideStatus;
import org.example.geo.LatLang;
import org.example.kafka.events.RideCreatedEvent;
import org.example.kafka.producer.RideEventProducer;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.geo.Point;

import java.util.Set;
import org.springframework.transaction.annotation.Transactional;
import org.example.dto.request.CreateRideRequest;
import org.example.dto.request.JoinRideRequest;
import org.example.dto.response.RideResponse;
import org.example.entities.Ride;
import org.example.exception.*;
import org.example.repos.RideRepo;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class RideServiceImpl implements RideService {

    private final RideRepo rideRepo;
    private final GeocodingService geocodingService;
    private final RoutingService routingService;
    private final RouteMatchingService routeMatchingService;
    private final RideEventProducer rideEventProducer;
    private final RedisGeoService redisGeoService;

    public RideServiceImpl(RideRepo rideRepo, GeocodingService geocodingService,
                           RoutingService routingService, RouteMatchingService routeMatchingService,
                           RideEventProducer rideEventProducer, RedisGeoService redisGeoService) {
        this.rideRepo = rideRepo;
        this.geocodingService = geocodingService;
        this.routingService = routingService;
        this.routeMatchingService = routeMatchingService;
        this.rideEventProducer = rideEventProducer;
        this.redisGeoService = redisGeoService;
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
        ride.setCreaterId(userId);
        ride.setRideStatus(RideStatus.OPEN);
        ride.setCreatedAt(LocalDateTime.now());

        Ride savedRide = rideRepo.save(ride);

        // Geospatial Indexing: Add BOTH pickup and dropoff points to Redis so users near either end can discover the ride
        if (start != null) redisGeoService.addRideLocation(savedRide.getRideId() + "_from", start);
        if (end != null) redisGeoService.addRideLocation(savedRide.getRideId() + "_to", end);

        List<String> nearbyPickupUsers = redisGeoService.findUsersNear(start, 10.0);
        List<String> nearbyDropoffUsers = redisGeoService.findUsersNear(end, 10.0);
        Set<String> allNearbyUsers = new HashSet<>();
        if(nearbyPickupUsers != null) allNearbyUsers.addAll(nearbyPickupUsers);
        if(nearbyDropoffUsers != null) allNearbyUsers.addAll(nearbyDropoffUsers);
        List<String> nearbyUserIds = new ArrayList<>(allNearbyUsers);

        RideCreatedEvent event = new RideCreatedEvent(
                savedRide.getRideId(),
                savedRide.getCreaterId(),
                savedRide.getFromLocation(),
                savedRide.getToLocation(),
                savedRide.getDepartureTime(),
                savedRide.getTotalSeats(),
                nearbyUserIds
        );

        rideEventProducer.publishRideCreatedEvent(event);

        return mapToResponse(savedRide);
    }

    @Override
    @Transactional
    public RideResponse closeRide(String rideId, String userId) {
        Ride ride = rideRepo.findById(rideId).orElseThrow(() -> new RideNotFoundException("Ride not found"));
        if (!ride.getCreaterId().equals(userId)) {
            throw new InvalidRideActionException("You are not the creator of this ride.");
        }
        ride.setRideStatus(RideStatus.CLOSED);
        rideRepo.save(ride);
        return mapToResponse(ride);
    }

    @Override
    @Transactional
    public void deleteRide(String rideId, String userId) {
        Ride ride = rideRepo.findById(rideId).orElseThrow(() -> new RideNotFoundException("Ride not found"));
        if (!ride.getCreaterId().equals(userId)) {
            throw new InvalidRideActionException("You are not the creator of this ride.");
        }
        rideRepo.delete(ride);
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 * * * *") // Runs every hour
    @Transactional
    public void cleanupExpiredRides() {
        log.info("Running scheduled cleanup for expired rides.");
        rideRepo.deleteAllByDepartureTimeBefore(LocalDateTime.now());
    }    @Override
    @Cacheable(value = "rides", key = "#rideId")
    public RideResponse getRide(String rideId) {
        log.info("Fetching ride details for rideId: {}", rideId);
        Ride ride = rideRepo.findById(rideId).orElseThrow(() -> new RideNotFoundException("Ride not found"));
        return mapToResponse(ride);
    }

    @Override
    public List<RideResponse> matchRides(String fromLocation, String toLocation) {
        // 1. Convert user's pickup and drop-off to coordinates
        LatLang userStart = geocodingService.geocode(fromLocation);
        LatLang userEnd = geocodingService.geocode(toLocation);

        // 2. Use Redis to find Ride IDs within 5km of the user's pickup point
        List<String> nearbyRideIds = redisGeoService.findRidesNear(userStart, 5.0);

        if (nearbyRideIds == null || nearbyRideIds.isEmpty()) {
            return new ArrayList<>();
        }

        // 3. Fetch only those specific rides from the DB
        List<Ride> nearbyRides = rideRepo.findAllById(nearbyRideIds);

        List<RideResponse> matches = new ArrayList<>();

        // 4. Detailed matching: Check if destination is near the driver's route
        for (Ride ride : nearbyRides) {
            if (RideStatus.OPEN.equals(ride.getRideStatus())) {
                boolean isNearRoute = routeMatchingService.isDestinationNearRoute(ride.getRoutePolyline(), userEnd);

                if (isNearRoute) {
                    matches.add(mapToResponse(ride));
                }
            }
        }
        return matches;
    }

    @Override
    public List<RideResponse> getNearbyRides(String userId) {
        List<Point> userPositions = redisGeoService.getUserPositions(userId);
        if (userPositions.isEmpty()) {
            return new ArrayList<>();
        }

        Set<String> uniqueRideIds = new HashSet<>();

        for (Point pos : userPositions) {
            LatLang loc = new LatLang();
            loc.setLatitude(pos.getY());
            loc.setLongitude(pos.getX());

            List<String> nearbyRideKeys = redisGeoService.findRidesNear(loc, 10.0);
            if (nearbyRideKeys != null) {
                for (String key : nearbyRideKeys) {
                    // Strip the _from / _to suffix to get the actual rideId
                    String rideId = key.replaceAll("_(from|to)$", "");
                    uniqueRideIds.add(rideId);
                }
            }
        }

        if (uniqueRideIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Ride> nearbyRides = rideRepo.findAllById(uniqueRideIds);
        List<RideResponse> responses = new ArrayList<>();
        for (Ride ride : nearbyRides) {
            if (RideStatus.OPEN.equals(ride.getRideStatus())) {
                responses.add(mapToResponse(ride));
            }
        }
        return responses;
    }

    @Override
    public Page<RideResponse> getAllRides(Pageable pageable) {
        return rideRepo.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    public Page<RideResponse> getRides(String toLocation, Boolean availableSeats, LocalDateTime before, LocalDateTime after, Pageable pageable) {
        Page<Ride> rides;
        if (before != null && after != null) rides = rideRepo.findByDepartureTimeBetween(after, before, pageable);
        else if (before != null) rides = rideRepo.findByDepartureTimeBefore(before, pageable);
        else if (after != null) rides = rideRepo.findByDepartureTimeAfter(after, pageable);
        else if (toLocation != null && Boolean.TRUE.equals(availableSeats)) rides = rideRepo.findByToLocationAndSeatsAvailableGreaterThan(toLocation, 0, pageable);
        else if (toLocation != null) rides = rideRepo.findByToLocation(toLocation, pageable);
        else if (Boolean.TRUE.equals(availableSeats)) rides = rideRepo.findBySeatsAvailableGreaterThan(0, pageable);
        else rides = rideRepo.findAll(pageable);

        return rides.map(this::mapToResponse);
    }

    @Override
    public Page<RideResponse> getMyOfferedRides(String userId, Pageable pageable) {
        return rideRepo.findByCreaterId(userId, pageable).map(this::mapToResponse);
    }



    private RideResponse mapToResponse(Ride ride) {
        String cName = redisGeoService.getUserName(ride.getCreaterId());
        String cPhone = redisGeoService.getUserPhone(ride.getCreaterId());

        return new RideResponse(
                ride.getRideId(), ride.getCreaterId(), cName, cPhone,
                ride.getToLocation(), ride.getFromLocation(),
                ride.getDepartureTime(), ride.getSeatsAvailable(),
                ride.getRideStatus()
        );
    }
}