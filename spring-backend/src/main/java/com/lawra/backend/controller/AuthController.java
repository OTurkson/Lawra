package com.lawra.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.lawra.backend.dto.LoginRequestDTO;
import com.lawra.backend.security.CustomUserDetails;
import com.lawra.backend.service.CustomUserDetailsService;
import com.lawra.backend.service.JwtService;

import lombok.RequiredArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
    private final CustomUserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        try {
            CustomUserDetails userDetails =
                    (CustomUserDetails) userDetailsService
                            .loadUserByEmailAndTenant(request.getEmail(), request.getTenantId());

            if (!passwordEncoder.matches(request.getPassword(), userDetails.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid credentials"));
            }

            // Generate token with custom claims (userId, tenantId, role)
            String token = jwtService.generateToken(userDetails);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("userId", userDetails.getUserId());
            response.put("tenantId", userDetails.getTenantId());
            response.put("role", userDetails.getAuthorities().iterator().next().getAuthority());

            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }
    }
}
