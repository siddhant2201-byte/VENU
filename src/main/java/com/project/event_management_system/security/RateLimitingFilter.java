package com.project.event_management_system.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.event_management_system.dto.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final int DEFAULT_LIMIT = 120;
    private static final int AUTH_LIMIT = 40;
    private static final int HOLD_LIMIT = 30;
    private static final int BOOKING_LIMIT = 25;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();

        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (path.startsWith("/v3/api-docs") || path.startsWith("/swagger-ui") || path.startsWith("/actuator")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        int limit = resolveLimit(path, request.getMethod());
        String redisKey = "rate_limit:" + resolveEndpointCategory(path) + ":" + clientIp;

        try {
            Long currentCount = redisTemplate.opsForValue().increment(redisKey);
            if (currentCount != null && currentCount == 1) {
                redisTemplate.expire(redisKey, Duration.ofMinutes(1));
            }

            long current = currentCount != null ? currentCount : 1L;
            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - current)));

            if (current > limit) {
                log.warn("RATE LIMIT EXCEEDED: IP {} on path {} (Count: {} / Limit: {})", clientIp, path, current, limit);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                ApiResponse<Void> errorResponse = ApiResponse.error("Too many requests. Rate limit exceeded. Please wait a minute before retrying.");
                response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
                return;
            }
        } catch (Exception ex) {

            log.warn("RateLimitingFilter encountered Redis error: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private String resolveEndpointCategory(String path) {
        if (path.startsWith("/api/auth")) return "auth";
        if (path.contains("/seats/hold")) return "hold";
        if (path.startsWith("/api/bookings")) return "booking";
        return "general";
    }

    private int resolveLimit(String path, String method) {
        if (path.startsWith("/api/auth")) {
            return AUTH_LIMIT;
        } else if (path.contains("/seats/hold")) {
            return HOLD_LIMIT;
        } else if (path.startsWith("/api/bookings") && "POST".equalsIgnoreCase(method)) {
            return BOOKING_LIMIT;
        }
        return DEFAULT_LIMIT;
    }
}
