package com.lawra.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class LoanPackageDTO {
    private Long id;
    private BigDecimal balance;
    private BigDecimal interestRate;
    private VirtualBankDTO virtualBank;
}
