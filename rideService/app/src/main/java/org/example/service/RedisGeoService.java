package org.example.service;

import org.example.geo.LatLang;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

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

    public void addUserLocation(String userId, LatLang location, int placeIndex){
        if(location != null) {
            stringRedisTemplate.opsForGeo().add("user_location",
                    new Point(location.getLongitude(), location.getLatitude()), userId + "_" + placeIndex);
        }
    }

    public List<String> findUsersNear(LatLang location, double radius){
        if(location == null) return List.of();
        
        Circle area = new Circle(new Point(location.getLongitude(), location.getLatitude()),
                new Distance(radius, Metrics.KILOMETERS));

        GeoResults<RedisGeoCommands.GeoLocation<String>> results =
                stringRedisTemplate.opsForGeo().radius("user_location", area);

        if(results == null) return List.of();
        
        return results.getContent().stream()
                .map(result -> {
                    String name = result.getContent().getName();
                    int lastIndex = name.lastIndexOf('_');
                    return lastIndex > 0 ? name.substring(0, lastIndex) : name;
                })
                .distinct()
                .collect(Collectors.toList());
    }

    public List<Point> getUserPositions(String userId) {
        List<Point> p1 = stringRedisTemplate.opsForGeo().position("user_location", userId + "_1");
        List<Point> p2 = stringRedisTemplate.opsForGeo().position("user_location", userId + "_2");
        List<Point> positions = new ArrayList<>();
        if (p1 != null && !p1.isEmpty() && p1.get(0) != null) positions.add(p1.get(0));
        if (p2 != null && !p2.isEmpty() && p2.get(0) != null) positions.add(p2.get(0));
        return positions;
    }

    public void saveUserInfo(String userId, String name, String phone) {
        if (name != null) stringRedisTemplate.opsForHash().put("user_info:" + userId, "name", name);
        if (phone != null) stringRedisTemplate.opsForHash().put("user_info:" + userId, "phoneNumber", phone);
    }

    public String getUserName(String userId) {
        Object name = stringRedisTemplate.opsForHash().get("user_info:" + userId, "name");
        return name != null ? name.toString() : null;
    }

    public String getUserPhone(String userId) {
        Object phone = stringRedisTemplate.opsForHash().get("user_info:" + userId, "phoneNumber");
        return phone != null ? phone.toString() : null;
    }

}
