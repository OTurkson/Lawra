package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class UserResponseDTO {
    private UUID id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private BigDecimal balance;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}