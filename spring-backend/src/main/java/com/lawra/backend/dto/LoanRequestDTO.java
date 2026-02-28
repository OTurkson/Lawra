package com.lawra.backend.dto;

import com.lawra.backend.enums.LoanPeriod;
import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.model.User;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class LoanRequestDTO {
    private LoanPackage loanPackage;
    private BigDecimal principalAmount;
    private BigDecimal interestRate;
    private LoanPeriod period;
    private User borrower;
}
