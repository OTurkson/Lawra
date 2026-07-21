package com.lawra.backend.controller;

import com.lawra.backend.dto.LoanPackageDTO;
import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.service.LoanPackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/loan-packages")
@RequiredArgsConstructor
public class LoanPackageController {

	private final LoanPackageService loanPackageService;

	// display, create, update and delete loan packages (within VB)
	@GetMapping
	@PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN') or hasRole('BORROWER')")
	public ResponseEntity<List<LoanPackageDTO>> getLoanPackages() {
		return ResponseEntity.ok(loanPackageService.getAll());
	}

	@GetMapping("/user/{id}")
	@PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN') or hasRole('BORROWER')")
	public ResponseEntity<List<LoanPackageDTO>> getLoanPackagesPerUser() {
		return ResponseEntity.ok(loanPackageService.getAllLoanPackagesPerUser());
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN') or hasRole('BORROWER')")
	public ResponseEntity<LoanPackageDTO> getLoanPackage(@PathVariable Long id) {
		return ResponseEntity.ok(loanPackageService.getById(id));
	}

	@PostMapping
	@PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN') or hasRole('BORROWER')")
	public ResponseEntity<?> createLoanPackage(@RequestBody LoanPackage loanPackage) {
		if (loanPackage == null || loanPackage.getVirtualBank() == null || loanPackage.getVirtualBank().getId() == null) {
			return ResponseEntity.badRequest().body("virtualBank.id is required");
		}

		// Delegate to service and allow service to throw meaningful ResponseStatusException
		LoanPackage created = loanPackageService.create(loanPackage);
		return ResponseEntity.ok(created);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN') or hasRole('BORROWER')")
	public ResponseEntity<LoanPackage> updateLoanPackage(@PathVariable Long id, @RequestBody LoanPackage loanPackage) {
		return ResponseEntity.ok(loanPackageService.update(id, loanPackage));
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN') or hasRole('BORROWER')")
	public ResponseEntity<Void> deleteLoanPackage(@PathVariable Long id) {
		loanPackageService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
