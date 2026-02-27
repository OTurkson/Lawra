package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRequestDTO {
    private String email;
    private String fullName;
    private String phoneNumber;
}
