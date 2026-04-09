package com.cabit.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

/**
 * Rate Limiter Configuration.
 *
 * Uses the client's IP address as the rate-limiting key.
 * This lets the gateway enforce per-IP request limits via Redis.
 * Limits are defined in application.yml per route.
 */
@Configuration
public class RateLimiterConfig {

    /**
     * Resolves the rate-limiting key from the remote IP address.
     * Referenced in application.yml as: key-resolver: "#{@ipKeyResolver}"
     */
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just(ip);
        };
    }
}
