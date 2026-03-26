package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class UserResponseDTO {
    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private BigDecimal balance;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}