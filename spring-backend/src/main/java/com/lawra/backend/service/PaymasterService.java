package com.lawra.backend.service;

import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.model.Loan;
import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.model.VirtualBank;
import com.lawra.backend.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymasterService {

	private final LoanRepository loanRepository;

	public List<LoanSummaryDTO> getLoanSummaries(LoanStatus status) {
		List<Loan> loans = (status == null)
				? loanRepository.findAll()
				: loanRepository.findByStatus(status);

		return loans.stream()
				.map(this::toSummary)
				.collect(Collectors.toList());
	}

	public LoanSummaryDTO updateLoanStatus(Long id, LoanStatus status) {
		Loan loan = loanRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found"));

		loan.setStatus(status);
		Loan saved = loanRepository.save(loan);
		return toSummary(saved);
	}

	private LoanSummaryDTO toSummary(Loan loan) {
		LoanSummaryDTO dto = new LoanSummaryDTO();
		dto.setId(loan.getId());
		dto.setStatus(loan.getStatus());

		// Amount and interest
		dto.setAmount(loan.getPrincipalAmount());
		dto.setInterest(loan.getInterestRate() != null ? loan.getInterestRate().toPlainString() + "%" : "");

		// Borrower information
		if (loan.getBorrower() != null) {
			dto.setBorrowerName(loan.getBorrower().getFullName());
			dto.setAccountName(loan.getBorrower().getFullName());
		}

		// Virtual bank / loan package info
		LoanPackage loanPackage = loan.getLoanPackage();
		if (loanPackage != null) {
			VirtualBank bank = loanPackage.getVirtualBank();
			if (bank != null) {
				dto.setVirtualBank(bank.getName());
				dto.setBank(bank.getName());
			}
		}

		// Tenure and simple installment placeholder for UI
		if (loan.getPeriod() != null) {
			dto.setTenure(loan.getPeriod().name());
		}

		// Very rough placeholder installment: total / 12 (if available)
		if (loan.getTotalRepaymentAmount() != null) {
			BigDecimal monthly = loan.getTotalRepaymentAmount().divide(BigDecimal.valueOf(12), BigDecimal.ROUND_HALF_UP);
			dto.setInstallment(monthly);
		}

		// Placeholder account number based on loan id for display purposes
		dto.setAccountNumber(loan.getId() != null ? "LN-" + loan.getId() : "");

		return dto;
	}
}

