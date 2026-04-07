package com.lawra.backend.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.lawra.backend.model.User;
import com.lawra.backend.repository.UserRepository;
import com.lawra.backend.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService {
     private final UserRepository userRepository;

    public UserDetails loadUserByEmailAndTenant(String email, UUID tenantId) {
        User user = userRepository
                .findByEmailAndTenantId(email, tenantId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new CustomUserDetails(user);
    }
}
