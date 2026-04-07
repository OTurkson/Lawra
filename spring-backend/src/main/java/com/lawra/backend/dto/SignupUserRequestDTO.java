package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class SignupUserRequestDTO {
    private String email;
    private String fullName;
    private String phoneNumber;
    private String password;
    private UUID tenantId;
}
