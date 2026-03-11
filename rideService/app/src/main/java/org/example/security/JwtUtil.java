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
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(keyBytes))
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}
