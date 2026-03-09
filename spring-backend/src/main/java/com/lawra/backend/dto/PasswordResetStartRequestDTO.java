package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordResetStartRequestDTO {
    private String email;
    private Long tenantId;
}
