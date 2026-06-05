package com.lawra.backend.controller;

import com.lawra.backend.dto.BorrowerLoanPackageDTO;
import com.lawra.backend.dto.LoanRequestDTO;
import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.service.BorrowerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// LOAN APPLICATIONS
@RestController
@RequiredArgsConstructor
@RequestMapping()
public class BorrowerController {
    private final BorrowerService borrowerService;

//    request loan - BORROWER and PAYMASTER roles can create their own loan requests
    @PostMapping("/loans")
    @PreAuthorize("hasRole('BORROWER') or hasRole('PAYMASTER')")
    public ResponseEntity<LoanSummaryDTO> createLoan(@RequestBody LoanRequestDTO loanRequest) {
        LoanSummaryDTO loanSummary = borrowerService.createLoan(loanRequest);
        return ResponseEntity.ok(loanSummary);
    }

//    display loans requests for the authenticated borrower/paymaster user.
    @GetMapping("/users/{borrowerId}/loans")
    @PreAuthorize("hasRole('BORROWER') or hasRole('PAYMASTER')")
    public ResponseEntity<List<LoanSummaryDTO>> getLoansPerBorrower(@PathVariable UUID borrowerId) {
        List<LoanSummaryDTO> loansPerBorrower = borrowerService.getLoansPerBorrower(borrowerId);
        return ResponseEntity.ok(loansPerBorrower);
    }

    @GetMapping("/borrower/loan-packages")
    @PreAuthorize("hasRole('BORROWER') or hasRole('PAYMASTER')")
    public ResponseEntity<List<BorrowerLoanPackageDTO>> getBorrowerLoanPackages() {
        return ResponseEntity.ok(borrowerService.getBorrowerLoanPackages());
    }

//    Corresponding list of ALL loans -> Paymaster Controller
}
