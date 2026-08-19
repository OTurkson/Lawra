package com.lawra.backend.mapper;

import com.lawra.backend.dto.LoanRequestDTO;
import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.enums.RepaymentStatus;
import com.lawra.backend.model.Loan;
import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.model.User;
import com.lawra.backend.model.VirtualBank;
import com.lawra.backend.repository.RepaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class LoanMapper {
    private final RepaymentRepository repaymentRepository;
    public Loan map(LoanRequestDTO request, LoanPackage loanPackage, User borrower) {
        return Loan.builder()
                .loanPackage(loanPackage)
                .principalAmount(request.getPrincipalAmount())
                // Package terms are authoritative; clients must not choose their own rate.
                .interestRate(loanPackage.getInterestRate())
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
        BigDecimal totalPaid = repaymentRepository.totalPaidForLoan(loan.getId());
        dto.setTotalPaid(totalPaid);
        BigDecimal outstanding = loan.getTotalRepaymentAmount().subtract(totalPaid);
        dto.setOutstandingAmount(outstanding);
        dto.setRepaymentStatus(repaymentStatus(loan, totalPaid, outstanding));
        dto.setDueDate(loan.getDueDate());

        if (loan.getBorrower() != null) {
            dto.setBorrowerId(loan.getBorrower().getId());
            dto.setBorrowerName(loan.getBorrower().getFullName());
        }

        if (loan.getApprovedBy() != null) {
            dto.setApprovedBy(loan.getApprovedBy().getFullName());
        }

        LoanPackage loanPackage = loan.getLoanPackage();
        if (loanPackage != null) {
            dto.setLoanPackage(loanPackage.getName());
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

    private RepaymentStatus repaymentStatus(Loan loan, BigDecimal totalPaid, BigDecimal outstanding) {
        if (outstanding.compareTo(BigDecimal.ZERO) <= 0) return RepaymentStatus.PAID;
        if (loan.getDueDate() != null && loan.getDueDate().isBefore(LocalDate.now())) {
            return RepaymentStatus.OVERDUE;
        }
        if (totalPaid.compareTo(BigDecimal.ZERO) > 0) return RepaymentStatus.PARTIAL;
        return RepaymentStatus.PENDING;
    }
}
