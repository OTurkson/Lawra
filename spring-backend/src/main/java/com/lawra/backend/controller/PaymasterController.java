package com.lawra.backend.controller;

import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.service.PaymasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/paymaster")
@RequiredArgsConstructor
public class PaymasterController {

	private final PaymasterService paymasterService;

	// List all loan applications, optionally filtered by status
	@GetMapping("/loans")
	public ResponseEntity<?> getLoans(@RequestParam(name = "status", required = false) LoanStatus status) {
		return ResponseEntity.ok(paymasterService.getLoanSummaries(status));
	}

	// Approve a specific loan
	@PostMapping("/loans/{id}/approve")
	public ResponseEntity<LoanSummaryDTO> approveLoan(@PathVariable Long id) {
		return ResponseEntity.ok(paymasterService.updateLoanStatus(id, LoanStatus.APPROVED));
	}

	// Reject a specific loan
	@PostMapping("/loans/{id}/reject")
	public ResponseEntity<LoanSummaryDTO> rejectLoan(@PathVariable Long id) {
		return ResponseEntity.ok(paymasterService.updateLoanStatus(id, LoanStatus.REJECTED));
	}
}
