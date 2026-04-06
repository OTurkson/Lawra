package com.lawra.backend.service;

import com.lawra.backend.dto.LoanRequestDTO;
import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.enums.LoanPeriod;
import com.lawra.backend.mapper.LoanMapper;
import com.lawra.backend.model.Loan;
import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.model.User;
import com.lawra.backend.repository.LoanPackageRepository;
import com.lawra.backend.repository.LoanRepository;
import com.lawra.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BorrowerService {
    private final LoanRepository loanRepository;
    private final LoanPackageRepository loanPackageRepository;
    private final UserRepository userRepository;
    private final LoanMapper loanMapper;

    // request loan
    public LoanSummaryDTO createLoan(LoanRequestDTO loanRequest) {
        // Resolve referenced entities safely
        LoanPackage loanPackage = loanPackageRepository.findById(loanRequest.getLoanPackageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan package not found"));

        if (loanRequest.getPrincipalAmount() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Principal amount is required");
        }

        if (loanRequest.getPrincipalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Principal amount must be greater than zero");
        }

        if (loanPackage.getBalance() != null && loanRequest.getPrincipalAmount().compareTo(loanPackage.getBalance()) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested amount exceeds package balance. Please enter a lower amount."
            );
        }

        User borrower = userRepository.findById(loanRequest.getBorrowerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Borrower not found"));

        Loan loan = loanMapper.map(loanRequest, loanPackage, borrower);

        // Calculate total repayment amount based on principal, interest rate, and period
        BigDecimal principal = loan.getPrincipalAmount();
        BigDecimal rate = loan.getInterestRate();
        LoanPeriod period = loan.getPeriod();

        if (principal != null && rate != null && period != null) {
            BigDecimal years;
            switch (period) {
                case THREE_MONTHS -> years = BigDecimal.valueOf(0.25);
                case SIX_MONTHS -> years = BigDecimal.valueOf(0.5);
                default -> years = BigDecimal.ONE;
            }

            BigDecimal interestFactor = rate
                    .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)
                    .multiply(years);

            BigDecimal total = principal
                    .multiply(BigDecimal.ONE.add(interestFactor))
                    .setScale(2, RoundingMode.HALF_UP);

            loan.setTotalRepaymentAmount(total);
        }

        // Derive due date from period if not already set
        if (loan.getDueDate() == null && loan.getPeriod() != null) {
            LocalDate now = LocalDate.now();
            LocalDate dueDate;
            switch (loan.getPeriod()) {
                case THREE_MONTHS -> dueDate = now.plusMonths(3);
                case SIX_MONTHS -> dueDate = now.plusMonths(6);
                case ONE_YEAR -> dueDate = now.plusYears(1);
                default -> dueDate = now;
            }
            loan.setDueDate(dueDate);
        }

        loanRepository.save(loan);

        return loanMapper.toSummary(loan);
    }

    // display loan requests per user/borrower.
    public List<LoanSummaryDTO> getLoansPerBorrower(Long borrowerId) {
        userRepository.findById(borrowerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Borrower not found"));

        List<Loan> loans = loanRepository.findByBorrower_Id(borrowerId);
        List<LoanSummaryDTO> loansPerBorrower = new ArrayList<>();

        for (Loan loan : loans) {
            loansPerBorrower.add(loanMapper.toSummary(loan));
        }
        return loansPerBorrower;
    }

    // Corresponding list of ALL loans -> Paymaster Service

}
