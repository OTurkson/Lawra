package com.lawra.backend.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Lightweight implementation of CustomUserDetails for JWT authentication.
 * This is used when we only have claims from the JWT token without loading the full User entity.
 */
public class CustomUserDetailsStub implements UserDetails {

    private final Long userId;
    private final Long tenantId;
    private final String role;

    public CustomUserDetailsStub(Long userId, Long tenantId, String role) {
        this.userId = userId;
        this.tenantId = tenantId;
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getTenantId() {
        return tenantId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Add ROLE_ prefix for Spring Security's hasRole() method
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return null; // Not needed for JWT authentication
    }

    @Override
    public String getUsername() {
        return String.valueOf(userId);
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
