package org.example.service;

import org.example.geo.DistanceCalculator;
import org.example.geo.LatLang;
import org.example.geo.PolylineDecoder;

import java.util.List;

public class RouteMatchingService {

    private static final double Match_Threshold = 5.0;

    public boolean isDestinationNearRoute(String polyline, LatLang destination){

        List<LatLang> routePoints = PolylineDecoder.decode(polyline);

        for(LatLang routePoint : routePoints){
            double distance = DistanceCalculator.distance(routePoint, destination);

            if (distance < Match_Threshold){
                return true;
            }
        }
        return false;
    }

}
