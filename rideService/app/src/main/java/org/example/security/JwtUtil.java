package org.example.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {
    
    @Value("${jwt.secret}")
    private String secretKey;

    public String extactUserName(String token) {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        io.jsonwebtoken.Claims claims = Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(keyBytes))
                .build()
                .parseClaimsJws(token)
                .getBody();
        // Prefer the userId claim (UUID) over the subject (display name)
        Object userId = claims.get("userId");
        if (userId != null) {
            return userId.toString();
        }
        return claims.getSubject();
    }
}
