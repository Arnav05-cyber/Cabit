package org.example.service;

import org.example.geo.LatLang;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class RoutingService {

    @Value("${openrouteservice.api.key}")
    private String apiKey;

    private final WebClient webClient;

    public RoutingService(WebClient.Builder builder, @Value("${openrouteservice.api.url}") String apiUrl){
        this.webClient = builder.baseUrl(apiUrl).build();
    }

    public String getRoutePolyline(LatLang start, LatLang end) {

        Map<String, Object> body = Map.of(
                "coordinates", List.of(
                        List.of(start.getLongitude(), start.getLatitude()),
                        List.of(end.getLongitude(), end.getLatitude())
                )
        );

        Map response = webClient.post()
                .uri("/v2/directions/driving-car")
                .header("Authorization", apiKey)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        List routes = (List) response.get("routes");
        Map route = (Map) routes.get(0);

        return (String) route.get("geometry");
    }
}


