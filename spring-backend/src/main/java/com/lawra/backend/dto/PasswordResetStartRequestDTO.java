package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class PasswordResetStartRequestDTO {
    private String email;
    private UUID tenantId;
}
