package com.lawra.backend.controller;

import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.service.LoanPackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/loan-packages")
@RequiredArgsConstructor
public class LoanPackageController {

	private final LoanPackageService loanPackageService;

	// display, create, update and delete loan packages (within VB)
	@GetMapping
	public ResponseEntity<List<LoanPackage>> getLoanPackages() {
		return ResponseEntity.ok(loanPackageService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<LoanPackage> getLoanPackage(@PathVariable Long id) {
		return ResponseEntity.ok(loanPackageService.getById(id));
	}

	@PostMapping
	public ResponseEntity<LoanPackage> createLoanPackage(@RequestBody LoanPackage loanPackage) {
		return ResponseEntity.ok(loanPackageService.create(loanPackage));
	}

	@PutMapping("/{id}")
	public ResponseEntity<LoanPackage> updateLoanPackage(@PathVariable Long id, @RequestBody LoanPackage loanPackage) {
		return ResponseEntity.ok(loanPackageService.update(id, loanPackage));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteLoanPackage(@PathVariable Long id) {
		loanPackageService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
