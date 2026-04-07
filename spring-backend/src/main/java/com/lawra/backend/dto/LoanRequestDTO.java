package com.lawra.backend.dto;

import com.lawra.backend.enums.LoanPeriod;
import com.lawra.backend.enums.LoanStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class LoanRequestDTO {
    private Long loanPackageId;
    private BigDecimal principalAmount;
    private BigDecimal interestRate;
    private LoanPeriod period;
    private UUID borrowerId;
    private LoanStatus loanStatus;
}
