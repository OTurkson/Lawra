package com.lawra.backend.controller;

import com.lawra.backend.dto.LoanRequestDTO;
import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.service.PaymasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("")
@RequiredArgsConstructor
public class PaymasterController {

	private final PaymasterService paymasterService;

	// List all loan applications, optionally filtered by status
	@GetMapping("/loans")
	@PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN')")
	public ResponseEntity<?> getLoans(@RequestParam(name = "status", required = false) LoanStatus status) {
		return ResponseEntity.ok(paymasterService.getLoanSummaries(status));
	}

	// Update status of a specific loan
	@PutMapping("/loans/{id}")
	@PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN')")
	public ResponseEntity<LoanSummaryDTO> updateLoanStatus(@PathVariable Long id, @RequestBody LoanRequestDTO loanUpdate) {
		return ResponseEntity.ok(paymasterService.updateLoanStatus(id, loanUpdate));
	}
}
