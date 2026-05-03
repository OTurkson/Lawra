package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UserBalanceTopUpRequestDTO {
    private BigDecimal amount;
}