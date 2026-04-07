package com.lawra.backend.config;

import com.lawra.backend.security.CustomUserDetails;
import com.lawra.backend.security.CustomUserDetailsStub;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Session;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class TenantFilterEnabler extends OncePerRequestFilter {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        UUID tenantId = null;
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails principal) {
            tenantId = principal.getTenantId();
        } else if (auth != null && auth.getPrincipal() instanceof CustomUserDetailsStub principal) {
            tenantId = principal.getTenantId();
        }

        if (tenantId != null) {

            Session session = entityManager.unwrap(Session.class);

            session.enableFilter("tenantFilter")
                   .setParameter("tenantId", tenantId.toString());
        }

        filterChain.doFilter(request, response);
    }
}