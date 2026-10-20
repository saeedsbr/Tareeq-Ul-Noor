package com.ilmpath.identity;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    private final long ttlHours;

    public JwtService(@Value("${ilmpath.jwt.secret}") String secret, @Value("${ilmpath.jwt.ttl-hours}") long ttlHours) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlHours = ttlHours;
    }

    public String issue(User u) {
        Instant now = Instant.now();
        return Jwts.builder().subject(u.getId()).claim("role", u.getRole().name())
            .issuedAt(Date.from(now)).expiration(Date.from(now.plus(Duration.ofHours(ttlHours))))
            .signWith(key).compact();
    }

    public String parseUserId(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return c.getSubject();
        } catch (Exception e) { return null; }
    }

    public Duration ttl() { return Duration.ofHours(ttlHours); }
}
