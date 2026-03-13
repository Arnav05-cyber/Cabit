package org.example.service;

import org.example.geo.LatLang;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RedisGeoService {

    private final StringRedisTemplate stringRedisTemplate;
    private static final String RIDE_LOCATION_KEY = "ride_location";

    public RedisGeoService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public void addRideLocation(String rideId, LatLang location){
        stringRedisTemplate.opsForGeo().add(RIDE_LOCATION_KEY,
                new Point(location.getLongitude(), location.getLatitude()), rideId);
    }

    public List<String> findRidesNear(LatLang location, double radius){
        Circle area = new Circle(new Point(location.getLongitude(), location.getLatitude()),
                new Distance(radius, Metrics.KILOMETERS));

        GeoResults<RedisGeoCommands.GeoLocation<String>> results =
                stringRedisTemplate.opsForGeo().radius(RIDE_LOCATION_KEY, area);

        return results.getContent().stream()
                .map(result -> result.getContent().getName())
                .collect(Collectors.toList());
    }


    public void removeRideLocation(String rideId) {
        stringRedisTemplate.opsForZSet().remove(RIDE_LOCATION_KEY, rideId);
    }

}
