package com.lawra.backend.controller;

import com.lawra.backend.dto.LoanRequestDTO;
import com.lawra.backend.dto.LoanSummaryDTO;
import com.lawra.backend.model.Loan;
import com.lawra.backend.service.BorrowerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// LOAN APPLICATIONS
@RestController
@RequiredArgsConstructor
@RequestMapping()
public class BorrowerController {
    private final BorrowerService borrowerService;

//    request loan - Only BORROWER role can create loan requests
    @PostMapping("/loans")
    public ResponseEntity<Loan> createLoan(@RequestBody LoanRequestDTO loanRequest) {
        Loan loan = borrowerService.createLoan(loanRequest);
        return ResponseEntity.ok(loan);
    }

//    display loans requests per user/borrower.
    @GetMapping("/users/{borrowerId}/loans")
    public ResponseEntity<List<LoanSummaryDTO>> getLoansPerBorrower(@PathVariable Long borrowerId) {
        List<LoanSummaryDTO> loansPerBorrower = borrowerService.getLoansPerBorrower(borrowerId);
        return ResponseEntity.ok(loansPerBorrower);
    }

//    Corresponding list of ALL loans -> Paymaster Controller
}
