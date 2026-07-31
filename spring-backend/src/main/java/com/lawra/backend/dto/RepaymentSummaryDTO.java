package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class RepaymentSummaryDTO {
    private Long id;
    private BigDecimal amount;
    private LocalDateTime paidAt;
    private UUID paidById;
    private String paidByName;
    private String paidByRole;
}
