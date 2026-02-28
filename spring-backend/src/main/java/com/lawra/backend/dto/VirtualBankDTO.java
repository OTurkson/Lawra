package com.lawra.backend.dto;

import com.lawra.backend.model.Tenant;
import com.lawra.backend.model.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VirtualBankDTO {
//    Don't display balance, createdAt, updatedAt
    private String name;
    private User createdBy;
    private Tenant organization;
}

