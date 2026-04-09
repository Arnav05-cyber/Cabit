package com.cabit.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.Key;

/**
 * JWT Authentication Filter for Spring Cloud Gateway.
 *
 * Applied to any route that has 'JwtAuthFilter' in its filters list.
 * Validates the Bearer token at the edge — downstream services receive
 * pre-validated requests with X-User-Id and X-Username headers injected.
 */
@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public JwtAuthFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            // 1. Check Authorization header
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
            }

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, "Invalid Authorization header format", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);

            // 2. Validate and parse the JWT
            try {
                Claims claims = extractAllClaims(token);

                // 3. Check expiration
                if (claims.getExpiration().before(new java.util.Date())) {
                    return onError(exchange, "JWT token has expired", HttpStatus.UNAUTHORIZED);
                }

                String username = claims.getSubject();
                String userId = claims.get("userId", String.class);

                // 4. Forward identity headers to downstream services
                ServerHttpRequest mutatedRequest = request.mutate()
                        .header("X-Username", username != null ? username : "")
                        .header("X-User-Id", userId != null ? userId : "")
                        .build();

                return chain.filter(exchange.mutate().request(mutatedRequest).build());

            } catch (Exception e) {
                return onError(exchange, "Invalid JWT token: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
            }
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");

        String body = "{\"error\": \"" + message + "\", \"status\": " + status.value() + "}";
        org.springframework.core.io.buffer.DataBuffer buffer =
                response.bufferFactory().wrap(body.getBytes());

        return response.writeWith(Mono.just(buffer));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .setSigningKey(getSignKey())
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public static class Config {
        // Configuration properties (can be extended later)
    }
}
