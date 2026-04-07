package com.lawra.backend.service;

import com.lawra.backend.model.Tenant;
import com.lawra.backend.model.User;
import com.lawra.backend.repository.TenantRepository;
import com.lawra.backend.repository.UserRepository;
import com.lawra.backend.security.CustomUserDetails;
import com.lawra.backend.security.CustomUserDetailsStub;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticatedUserContextService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    public UUID getCurrentTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getTenantId();
        }

        if (principal instanceof CustomUserDetailsStub stub) {
            return stub.getTenantId();
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication context");
    }

    public UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUserId();
        }

        if (principal instanceof CustomUserDetailsStub stub) {
            return stub.getUserId();
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication context");
    }

    public Tenant getCurrentTenant() {
        UUID tenantId = getCurrentTenantId();
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found"));
    }

    public User getCurrentUser() {
        UUID userId = getCurrentUserId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));
    }
}
