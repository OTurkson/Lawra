package com.lawra.backend.service;

import com.lawra.backend.dto.BorrowerLoanPackageDTO;
import com.lawra.backend.dto.LoanRequestDTO;
import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.dto.RepaymentRequestDTO;
import com.lawra.backend.dto.RepaymentSummaryDTO;
import com.lawra.backend.enums.LoanPeriod;
import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.enums.UserRole;
import com.lawra.backend.mapper.LoanMapper;
import com.lawra.backend.model.Loan;
import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.model.Repayment;
import com.lawra.backend.model.User;
import com.lawra.backend.repository.LoanPackageRepository;
import com.lawra.backend.repository.LoanRepository;
import com.lawra.backend.repository.UserRepository;
import com.lawra.backend.repository.RepaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BorrowerService {
    private final LoanRepository loanRepository;
    private final LoanPackageRepository loanPackageRepository;
    private final UserRepository userRepository;
    private final LoanMapper loanMapper;
    private final EmailService emailService;
    private final AuthenticatedUserContextService authenticatedUserContextService;
    private final RepaymentRepository repaymentRepository;
    private final AccountService accountService;

    // request loan
    public LoanSummaryDTO createLoan(LoanRequestDTO loanRequest) {
        UUID currentTenantId = authenticatedUserContextService.getCurrentTenantId();
        UUID currentUserId = authenticatedUserContextService.getCurrentUserId();

        if (!currentUserId.equals(loanRequest.getBorrowerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only create loans for your own account");
        }

        // Resolve referenced entities safely
        LoanPackage loanPackage = loanPackageRepository
                .findByIdAndVirtualBank_Tenant_Id(loanRequest.getLoanPackageId(), currentTenantId)
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

        if (!borrower.getTenant().getId().equals(currentTenantId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Borrower does not belong to your tenant");
        }

        if (!loanPackage.getVirtualBank().getTenant().getId().equals(currentTenantId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Loan package does not belong to your tenant");
        }

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

        Loan savedLoan = loanRepository.save(loan);
        emailService.sendLoanRequestEmail(borrower, savedLoan);

        return loanMapper.toSummary(savedLoan);
    }

    // display loan requests per user/borrower.
    public List<LoanSummaryDTO> getLoansPerBorrower(UUID borrowerId) {
        UUID currentTenantId = authenticatedUserContextService.getCurrentTenantId();
        UUID currentUserId = authenticatedUserContextService.getCurrentUserId();

        if (!currentUserId.equals(borrowerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own loans");
        }

        userRepository.findById(borrowerId)
            .filter(user -> user.getTenant().getId().equals(currentTenantId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Borrower not found"));

        List<Loan> loans = loanRepository.findByBorrower_IdAndBorrower_Tenant_Id(borrowerId, currentTenantId);
        return loans.stream()
                .sorted(Comparator.comparingInt(loan -> loanPriority(loan.getStatus())))
                .map(loanMapper::toSummary)
                .toList();
    }

    @org.springframework.transaction.annotation.Transactional
    public LoanSummaryDTO repayLoan(Long loanId, RepaymentRequestDTO request) {
        User payer = authenticatedUserContextService.getCurrentUser();
        UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
        Loan loan = loanRepository.findByIdAndTenantIdForRepayment(loanId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found"));

        boolean paysOwnLoan = loan.getBorrower().getId().equals(payer.getId());
        boolean canPayForEmployee = payer.getRole() == UserRole.PAYMASTER || payer.getRole() == UserRole.ADMIN;
        if (!paysOwnLoan && !canPayForEmployee) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only repay your own loan unless you are a paymaster");
        }
        if (loan.getStatus() != LoanStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only approved loans can be repaid");
        }
        if (request == null || request.getAmount() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repayment amount must be greater than zero");
        }

        BigDecimal amount;
        try {
            amount = request.getAmount().setScale(2, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Repayment amount can have at most two decimal places");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repayment amount must be greater than zero");
        }

        BigDecimal paid = repaymentRepository.totalPaidForLoan(loanId);
        BigDecimal outstanding = loan.getTotalRepaymentAmount().subtract(paid);
        if (outstanding.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This loan has already been fully repaid");
        }
        if (amount.compareTo(outstanding) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repayment exceeds the outstanding balance of " + outstanding);
        }

        // The person submitting the payment funds it. A paymaster payment never debits the borrower.
        accountService.debit(payer, amount);
        LoanPackage loanPackage = loan.getLoanPackage();
        loanPackage.setBalance(loanPackage.getBalance().add(amount));
        loanPackageRepository.save(loanPackage);

        Repayment repayment = new Repayment();
        repayment.setLoan(loan);
        repayment.setAmount(amount);
        repayment.setPaidBy(payer);
        repaymentRepository.save(repayment);
        BigDecimal outstandingAfterPayment = outstanding.subtract(amount);
        if (outstandingAfterPayment.compareTo(BigDecimal.ZERO) == 0) {
            loan.setStatus(LoanStatus.COMPLETED);
            loanRepository.save(loan);
        }
        emailService.sendRepaymentEmail(loan.getBorrower(), payer, loan, amount, outstandingAfterPayment);
        return loanMapper.toSummary(loan);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<RepaymentSummaryDTO> getRepayments(Long loanId) {
        User viewer = authenticatedUserContextService.getCurrentUser();
        UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
        Loan loan = loanRepository.findByIdAndBorrower_Tenant_Id(loanId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found"));
        boolean canViewAll = viewer.getRole() == UserRole.PAYMASTER || viewer.getRole() == UserRole.ADMIN;
        if (!canViewAll && !loan.getBorrower().getId().equals(viewer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view repayments for your own loans");
        }

        return repaymentRepository.findByLoan_IdOrderByPaidAtDesc(loanId).stream()
                .map(this::toRepaymentSummary)
                .toList();
    }

    private RepaymentSummaryDTO toRepaymentSummary(Repayment repayment) {
        User payer = repayment.getPaidBy() == null ? repayment.getLoan().getBorrower() : repayment.getPaidBy();
        RepaymentSummaryDTO dto = new RepaymentSummaryDTO();
        dto.setId(repayment.getId());
        dto.setAmount(repayment.getAmount());
        dto.setPaidAt(repayment.getPaidAt());
        dto.setPaidById(payer.getId());
        dto.setPaidByName(payer.getFullName());
        dto.setPaidByRole(payer.getRole().name());
        return dto;
    }

    public List<BorrowerLoanPackageDTO> getBorrowerLoanPackages() {
        UUID currentTenantId = authenticatedUserContextService.getCurrentTenantId();

        return loanPackageRepository.findByVirtualBank_Tenant_Id(currentTenantId)
                .stream()
                .map(loanPackage -> new BorrowerLoanPackageDTO(
                        loanPackage.getId(),
                        loanPackage.getName(),
                        loanPackage.getBalance(),
                        loanPackage.getInterestRate()
                ))
                .toList();
    }

    private int loanPriority(com.lawra.backend.enums.LoanStatus status) {
        if (status == null || status == com.lawra.backend.enums.LoanStatus.PENDING) return 0;
        if (status == com.lawra.backend.enums.LoanStatus.APPROVED) return 1;
        if (status == com.lawra.backend.enums.LoanStatus.COMPLETED) return 2;
        if (status == com.lawra.backend.enums.LoanStatus.REJECTED) return 3;
        return 4;
    }

    // Corresponding list of ALL loans -> Paymaster Service

}
