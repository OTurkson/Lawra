package com.lawra.backend.mapper;

import com.lawra.backend.dto.LoanRequestDTO;
import com.lawra.backend.model.Loan;
import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.model.User;
import org.springframework.stereotype.Component;

@Component
public class LoanMapper {
    public Loan map(LoanRequestDTO request, LoanPackage loanPackage, User borrower) {
        return Loan.builder()
                .loanPackage(loanPackage)
                .principalAmount(request.getPrincipalAmount())
                .interestRate(request.getInterestRate())
                .period(request.getPeriod())
                .borrower(borrower)
                .build();
    }
}
