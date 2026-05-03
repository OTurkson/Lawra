package com.lawra.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawra.backend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Validates that the tenant ID in the JWT token matches the tenant ID in the request path.
 * ADMIN role users bypass this check.
 * Pattern: /tenants/{tenantId}/resource
 */
@Component
@RequiredArgsConstructor
public class TenantValidationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        
        // Skip validation for auth endpoints, static resources, and health checks
        if (shouldSkipValidation(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract JWT token from Authorization header
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = bearerToken.substring(7);

        try {
            // Validate JWT token
            if (!jwtService.isTokenValid(token)) {
                sendForbiddenResponse(response, "Invalid or expired token");
                return;
            }

            // Extract role - ADMIN users bypass tenant validation
            String role = jwtService.extractRole(token);
            if ("ADMIN".equals(role)) {
                filterChain.doFilter(request, response);
                return;
            }

            // Extract tenantId from JWT
            String jwtTenantId = jwtService.extractTenantIdAsString(token);
            if (jwtTenantId == null || jwtTenantId.equals("null")) {
                sendForbiddenResponse(response, "No tenant context in token");
                return;
            }

            // Extract tenantId from path - pattern: /tenants/{tenantId}/...
            String pathTenantId = extractTenantIdFromPath(requestPath);
            
            // If path contains tenantId, validate it matches JWT
            if (pathTenantId != null && !pathTenantId.equals(jwtTenantId)) {
                sendForbiddenResponse(response, "Access denied: Tenant mismatch");
                return;
            }

            filterChain.doFilter(request, response);

        } catch (Exception e) {
            sendForbiddenResponse(response, "Token validation failed: " + e.getMessage());
        }
    }

    /**
     * Extract tenant ID from request path
     * Pattern: /tenants/{tenantId}/...
     */
    private String extractTenantIdFromPath(String path) {
        String[] parts = path.split("/");
        // Look for /tenants/{tenantId}/... pattern
        for (int i = 0; i < parts.length - 1; i++) {
            if ("tenants".equals(parts[i]) && i + 1 < parts.length) {
                String tenantId = parts[i + 1];
                if (!tenantId.isEmpty()) {
                    return tenantId;
                }
            }
        }
        return null;
    }

    private boolean shouldSkipValidation(String path) {
        // Skip auth endpoints
        if (path.startsWith("/auth")) return true;
        // Skip actuator endpoints
        if (path.startsWith("/actuator")) return true;
        // Skip swagger/api docs
        if (path.startsWith("/swagger") || path.startsWith("/v3/api-docs")) return true;
        // Skip health check
        if (path.equals("/health")) return true;
        // Skip public tenant list endpoint - marked as permitAll() in SecurityConfig
        if (path.equals("/tenants")) return true;
        // Skip public user registration endpoint - marked as permitAll() in SecurityConfig
        if (path.equals("/users")) return true;
        return false;
    }

    private void sendForbiddenResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", message);
        errorResponse.put("status", String.valueOf(HttpServletResponse.SC_FORBIDDEN));
        
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
