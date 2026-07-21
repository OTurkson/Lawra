package com.lawra.backend.service;

import com.lawra.backend.dto.LoanRequestDTO;
import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.mapper.LoanMapper;
import com.lawra.backend.model.Loan;
import com.lawra.backend.repository.LoanPackageRepository;
import com.lawra.backend.repository.LoanRepository;
import com.lawra.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymasterService {

	private final LoanRepository loanRepository;
	private final LoanMapper loanMapper;
	private final EmailService emailService;
	private final AuthenticatedUserContextService authenticatedUserContextService;
	private final UserRepository userRepository;
	private final LoanPackageRepository loanPackageRepository;

//	List all loans
	public List<LoanSummaryDTO> getLoanSummaries(LoanStatus status) {
		UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
		List<Loan> loans = (status == null)
				? loanRepository.findByBorrower_Tenant_Id(tenantId)
				: loanRepository.findByStatusAndBorrower_Tenant_Id(status, tenantId);

		return loans.stream()
				.map(loanMapper::toSummary)
				.collect(Collectors.toList());
	}

//	Update a single loan (status)
	public LoanSummaryDTO updateLoanStatus(Long id, LoanRequestDTO loanUpdate) {
		UUID tenantId = authenticatedUserContextService.getCurrentTenantId();

		Loan loan = loanRepository.findByIdAndBorrower_Tenant_Id(id, tenantId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found"));

		if (loanUpdate == null || loanUpdate.getLoanStatus() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "loanStatus is required");
		}

		LoanStatus newStatus = loanUpdate.getLoanStatus();
		UUID currentUserId = authenticatedUserContextService.getCurrentUserId();

		if (LoanStatus.APPROVED.equals(newStatus)
				&& currentUserId.equals(loan.getBorrower().getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot approve your own loan request");
		}

		loan.setStatus(newStatus);
		// Record who changed the loan status for approvals and rejections
		if (LoanStatus.APPROVED.equals(newStatus) || LoanStatus.REJECTED.equals(newStatus)) {
			loan.setApprovedBy(authenticatedUserContextService.getCurrentUser());
		} else {
			loan.setApprovedBy(null);
		}

		switch (newStatus) {
			case APPROVED -> applyApprovalEffects(loan);
			case COMPLETED -> applyCompletionEffects(loan);
			case REJECTED -> {
				// Rejected loans still need to be persisted so they appear in the loan history.
			}
			default -> {
				// Other statuses do not trigger balance changes.
			}
		}

		Loan saved = loanRepository.save(loan);
		if (LoanStatus.APPROVED.equals(newStatus)) {
			emailService.sendLoanApprovalEmail(saved.getBorrower(), authenticatedUserContextService.getCurrentUser(), saved);
		} else if (LoanStatus.REJECTED.equals(newStatus)) {
			emailService.sendLoanDecisionEmail(saved.getBorrower(), saved);
		}
		return loanMapper.toSummary(saved);
	}

	private void applyApprovalEffects(Loan loan) {
		try {
			// Add loan principal to borrower balance
			BigDecimal borrowerBalance = loan.getBorrower().getBalance();
			loan.getBorrower().setBalance(borrowerBalance.add(loan.getPrincipalAmount()));
			userRepository.save(loan.getBorrower());

			// Deduct loan principal from loan package balance
			BigDecimal loanPackageBalance = loan.getLoanPackage().getBalance();
			loan.getLoanPackage().setBalance(loanPackageBalance.subtract(loan.getPrincipalAmount()));
			loanPackageRepository.save(loan.getLoanPackage());
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem updating balances when approving loan: " + e.getMessage());
		}
	}

	private void applyCompletionEffects(Loan loan) {
		try {
			// Deduct total repayment amount from borrower balance (loan repayment)
			BigDecimal borrowerBalance = loan.getBorrower().getBalance();
			loan.getBorrower().setBalance(borrowerBalance.subtract(loan.getTotalRepaymentAmount()));
			userRepository.save(loan.getBorrower());

			// Add total repayment amount to virtual bank balance (funds received)
			BigDecimal virtualBankBalance = loan.getLoanPackage().getVirtualBank().getBalance();
			loan.getLoanPackage().getVirtualBank().setBalance(virtualBankBalance.add(loan.getTotalRepaymentAmount()));
			loanPackageRepository.save(loan.getLoanPackage());
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem updating balances when completing loan: " + e.getMessage());
		}
	}
}

