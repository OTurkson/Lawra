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

import java.math.BigDecimal;
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

		if (loan.getStatus().equals(LoanStatus.APPROVED)) {
			try {
				BigDecimal userBalance = loan.getBorrower().getBalance();
				userBalance = userBalance.add(loan.getPrincipalAmount());
				loan.getBorrower().setBalance(userBalance);
			} catch (Exception e) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem updating loan status");
			}

//			If successful, change loanStatus to DEFAULTED. NB: For now, we cannot track part repayment.
			loan.setStatus(LoanStatus.DEFAULTED);

		} else if (loan.getStatus().equals(LoanStatus.REJECTED)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found");
		}
//		When the borrower is repaying, return money to Virtual Bank
		else if (loan.getStatus().equals(LoanStatus.COMPLETED)) {
			try {
//				subtract from borrower's balance
				BigDecimal borrowerBalance = loan.getBorrower().getBalance();
				borrowerBalance = borrowerBalance.subtract(loan.getTotalRepaymentAmount());
				loan.getBorrower().setBalance(borrowerBalance);

//				add to virtual bank balance
				BigDecimal virtualBankBalance = loan.getLoanPackage().getVirtualBank().getBalance();
				virtualBankBalance = virtualBankBalance.add(loan.getTotalRepaymentAmount());
				loan.getLoanPackage().setBalance(virtualBankBalance);

			} catch (Exception e) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem updating loan status");
			}
		}

		Loan saved = loanRepository.save(loan);
		return loanMapper.toSummary(saved);
	}
}

