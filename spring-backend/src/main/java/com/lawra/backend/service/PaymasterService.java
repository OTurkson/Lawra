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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Comparator;
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
	private final AccountService accountService;

//	List all loans
	public List<LoanSummaryDTO> getLoanSummaries(LoanStatus status) {
		UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
		List<Loan> loans = (status == null)
				? loanRepository.findByBorrower_Tenant_Id(tenantId)
				: loanRepository.findByStatusAndBorrower_Tenant_Id(status, tenantId);

		return loans.stream()
				.sorted(Comparator.comparingInt(loan -> loanPriority(loan.getStatus())))
				.map(loanMapper::toSummary)
				.collect(Collectors.toList());
	}

	private int loanPriority(LoanStatus status) {
		if (status == null || status == LoanStatus.PENDING) return 0;
		if (status == LoanStatus.APPROVED) return 1;
		if (status == LoanStatus.COMPLETED) return 2;
		if (status == LoanStatus.REJECTED) return 3;
		return 4;
	}

//	Update a single loan (status)
	@Transactional
	public LoanSummaryDTO updateLoanStatus(Long id, LoanRequestDTO loanUpdate) {
		UUID tenantId = authenticatedUserContextService.getCurrentTenantId();

		Loan loan = loanRepository.findByIdAndTenantIdForDecision(id, tenantId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found"));

		if (loanUpdate == null || loanUpdate.getLoanStatus() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "loanStatus is required");
		}

		LoanStatus newStatus = loanUpdate.getLoanStatus();
		if (newStatus != LoanStatus.APPROVED && newStatus != LoanStatus.REJECTED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Loan decisions must be APPROVED or REJECTED; completed status is set by repayments");
		}
		if (loan.getStatus() != LoanStatus.PENDING) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending loans can be decided");
		}
		UUID currentUserId = authenticatedUserContextService.getCurrentUserId();

		if ((LoanStatus.APPROVED.equals(newStatus) || LoanStatus.REJECTED.equals(newStatus))
				&& currentUserId.equals(loan.getBorrower().getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot approve or reject your own loan request");
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
            case REJECTED -> {
                // Rejected loans still need to be persisted so they appear in the loan history.
			}
			default -> {
				// Other statuses do not trigger balance changes.
			}
		}

		Loan saved = loanRepository.save(loan);
		emailService.sendLoanDecisionEmail(
				saved.getBorrower(), authenticatedUserContextService.getCurrentUser(), saved);
		return loanMapper.toSummary(saved);
	}

	private void applyApprovalEffects(Loan loan) {
		var loanPackage = loanPackageRepository
				.findForUpdateByIdAndVirtualBank_Tenant_Id(
						loan.getLoanPackage().getId(), loan.getBorrower().getTenant().getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan package not found"));
		BigDecimal packageBalance = loanPackage.getBalance() == null ? BigDecimal.ZERO : loanPackage.getBalance();
		if (packageBalance.compareTo(loan.getPrincipalAmount()) < 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Loan package no longer has enough funds to approve this loan");
		}

		accountService.credit(loan.getBorrower(), loan.getPrincipalAmount());
		loanPackage.setBalance(packageBalance.subtract(loan.getPrincipalAmount()));
		loanPackageRepository.save(loanPackage);
	}

}

