package com.lawra.backend.service;

import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.mapper.LoanMapper;
import com.lawra.backend.model.Loan;
import com.lawra.backend.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymasterService {

	private final LoanRepository loanRepository;
	private final LoanMapper loanMapper;

//	List all loans
	public List<LoanSummaryDTO> getLoanSummaries(LoanStatus status) {
		List<Loan> loans = (status == null)
				? loanRepository.findAll()
				: loanRepository.findByStatus(status);

		return loans.stream()
				.map(loanMapper::toSummary)
				.collect(Collectors.toList());
	}

//	Update a single loan (status)
	public LoanSummaryDTO updateLoanStatus(Long id, LoanStatus status) {
		Loan loan = loanRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found"));

		loan.setStatus(status);
		Loan saved = loanRepository.save(loan);
		return loanMapper.toSummary(saved);
	}
}

