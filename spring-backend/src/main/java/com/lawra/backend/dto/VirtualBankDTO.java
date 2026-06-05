package com.lawra.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class VirtualBankDTO {
//    Don't display balance, createdAt, updatedAt
    private Long id;
    private String name;
    private BigDecimal balance;
    private UUID createdById;
    private String createdBy;
    private String tenant;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

