package org.example.service;

import org.example.geo.LatLang;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class GeocodingService {

    private final WebClient webClient;

    public GeocodingService(WebClient.Builder builder, @Value("${nominatim.api.url}") String apiUrl){
        this.webClient = builder.baseUrl(apiUrl).build();
    }

    public LatLang geocode(String address) {

        List<Map<String, Object>> response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search")
                        .queryParam("q", address)
                        .queryParam("format", "json")
                        .queryParam("limit", 1)
                        .build())
                .retrieve()
                .bodyToMono(List.class)
                .block();

        if (response == null || response.isEmpty()) {
            throw new RuntimeException("Location not found: " + address);
        }

        Map location = response.get(0);

        double lat = Double.parseDouble((String) location.get("lat"));
        double lon = Double.parseDouble((String) location.get("lon"));

        return new LatLang(lat, lon);
    }

}
