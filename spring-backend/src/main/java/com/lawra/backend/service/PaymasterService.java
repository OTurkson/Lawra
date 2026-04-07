package com.lawra.backend.service;

import com.lawra.backend.dto.LoanRequestDTO;
import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.mapper.LoanMapper;
import com.lawra.backend.model.Loan;
import com.lawra.backend.repository.LoanRepository;
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
	private final AuthenticatedUserContextService authenticatedUserContextService;

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
		if (LoanStatus.APPROVED.equals(newStatus)) {
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
		return loanMapper.toSummary(saved);
	}

	private void applyApprovalEffects(Loan loan) {
		try {
			BigDecimal userBalance = loan.getBorrower().getBalance();
			loan.getBorrower().setBalance(userBalance.add(loan.getPrincipalAmount()));

			BigDecimal loanPackageBalance = loan.getLoanPackage().getBalance();
			loan.getLoanPackage().setBalance(loanPackageBalance.subtract(loan.getPrincipalAmount()));
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem updating loan status");
		}
	}

	private void applyCompletionEffects(Loan loan) {
		try {
			BigDecimal borrowerBalance = loan.getBorrower().getBalance();
			loan.getBorrower().setBalance(borrowerBalance.subtract(loan.getTotalRepaymentAmount()));

			BigDecimal virtualBankBalance = loan.getLoanPackage().getVirtualBank().getBalance();
			loan.getLoanPackage().getVirtualBank().setBalance(virtualBankBalance.add(loan.getTotalRepaymentAmount()));
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem updating loan status");
		}
	}
}

