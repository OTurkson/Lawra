package com.lawra.backend.dto;

import com.lawra.backend.enums.LoanPeriod;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class LoanRequestDTO {
    private Long loanPackageId;
    private BigDecimal principalAmount;
    private BigDecimal interestRate;
    private LoanPeriod period;
    private Long borrowerId;
}
