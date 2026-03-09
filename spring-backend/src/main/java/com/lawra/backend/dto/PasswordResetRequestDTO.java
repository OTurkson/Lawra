package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordResetRequestDTO {
    private String token;
    private String newPassword;
}
