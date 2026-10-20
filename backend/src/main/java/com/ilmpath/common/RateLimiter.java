package com.ilmpath.common;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/** Simple in-memory sliding-window limiter (single-instance MVP). */
@Component
public class RateLimiter {
    private final ConcurrentMap<String, Deque<Instant>> hits = new ConcurrentHashMap<>();

    public void check(String key, int max, Duration window) {
        Deque<Instant> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        Instant now = Instant.now();
        synchronized (q) {
            while (!q.isEmpty() && q.peekFirst().isBefore(now.minus(window))) q.pollFirst();
            if (q.size() >= max) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Please try again later.");
            q.addLast(now);
        }
    }
}
