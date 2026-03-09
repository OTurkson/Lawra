package com.lawra.backend.dto;

import com.lawra.backend.model.Tenant;
import com.lawra.backend.model.User;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class VirtualBankDTO {
//    Don't display balance, createdAt, updatedAt
    private Long id;
    private String name;
    private BigDecimal balance;
    private String createdBy;
    private String tenant;
}

