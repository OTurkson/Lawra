package com.lawra.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class BorrowerLoanPackageDTO {
    private Long id;
    private String name;
    private BigDecimal balance;
    private BigDecimal interestRate;
}