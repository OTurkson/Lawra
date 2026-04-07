package com.lawra.backend.mapper;

import com.lawra.backend.dto.LoanRequestDTO;
import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.model.Loan;
import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.model.User;
import com.lawra.backend.model.VirtualBank;
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

    public LoanSummaryDTO toSummary(Loan loan) {
        LoanSummaryDTO dto = new LoanSummaryDTO();
        dto.setId(loan.getId());
        dto.setStatus(loan.getStatus());

        dto.setAmount(loan.getPrincipalAmount());
        dto.setInterest(loan.getInterestRate() != null ? loan.getInterestRate().toPlainString() + "%" : "");
        dto.setRepaymentAmount(loan.getTotalRepaymentAmount());

        if (loan.getBorrower() != null) {
            dto.setBorrowerName(loan.getBorrower().getFullName());
        }

        if (loan.getApprovedBy() != null) {
            dto.setApprovedBy(loan.getApprovedBy().getFullName());
        }

        LoanPackage loanPackage = loan.getLoanPackage();
        if (loanPackage != null) {
            VirtualBank bank = loanPackage.getVirtualBank();
            if (bank != null) {
                dto.setVirtualBank(bank.getName());
                dto.setBank(bank.getName());
            }
        }

        if (loan.getPeriod() != null) {
            dto.setTenure(loan.getPeriod().name());
        }

        return dto;
    }
}
