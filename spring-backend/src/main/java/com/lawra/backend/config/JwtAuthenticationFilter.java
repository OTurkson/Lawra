package com.lawra.backend.config;

import com.lawra.backend.security.CustomUserDetailsStub;
import com.lawra.backend.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            try {
                String token = header.substring(7);
                
                // Validate token signature and expiration
                if (!jwtService.isTokenValid(token)) {
                    logger.warn("Invalid or expired JWT token");
                    filterChain.doFilter(request, response);
                    return;
                }
                
                // Extract claims
                Claims claims = jwtService.extractClaim(token);

                Long userId = claims.get("userId", Long.class);
                Long tenantId = claims.get("tenantId", Long.class);
                String role = claims.get("role", String.class);

                // Validate required claims
                if (userId == null || tenantId == null || role == null) {
                    logger.warn("JWT token missing required claims");
                    filterChain.doFilter(request, response);
                    return;
                }

                CustomUserDetailsStub principal = new CustomUserDetailsStub(userId, tenantId, role);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        );
                
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
                
            } catch (JwtException | IllegalArgumentException e) {
                logger.error("JWT token validation failed: {}", e.getMessage());
                // Don't set authentication - request will be treated as unauthenticated
            }
        }

        filterChain.doFilter(request, response);
    }
}