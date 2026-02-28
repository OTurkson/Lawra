package com.lawra.backend.controller;

import com.lawra.backend.model.Loan;
import com.lawra.backend.service.BorrowerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// LOAN APPLICATIONS
@RestController
@RequiredArgsConstructor
@RequestMapping("/loans")
public class BorrowerController {
    private final BorrowerService borrowerService;

//    request loan
    @PostMapping
    public ResponseEntity<Loan> createLoan(@RequestBody Loan loanRequest) {
        Loan loan = borrowerService.createLoan(loanRequest);
        return ResponseEntity.ok(loan);
    }

//    display loans requests per user/borrower.
//    Corresponding list of ALL loans -> Paymaster Controller
}
