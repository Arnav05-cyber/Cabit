package org.example.geo;


import java.util.ArrayList;
import java.util.List;

public class PolylineDecoder {

    public static List<LatLang> decode(String polyline) {
        List<LatLang> coordinates = new ArrayList<>();

        int index = 0;
        int lat = 0;
        int lng = 0;

        while (index < polyline.length()) {

            int shift = 0;
            int result = 0;
            int b;

            do {
                b = polyline.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);

            int dlat = ((result & 1) != 0) ? ~(result >> 1) : (result >> 1);
            lat += dlat;

            shift = 0;
            result = 0;

            do {
                b = polyline.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);

            int dlng = ((result & 1) != 0) ? ~(result >> 1) : (result >> 1);
            lng += dlng;

            coordinates.add(
                    new LatLang(lat / 1E5, lng / 1E5)
            );
        }

        return coordinates;
    }
}
