package com.lawra.backend.service;

import com.lawra.backend.model.Loan;
import com.lawra.backend.repository.LoanRepository;
import com.lawra.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BorrowerService {
    private final LoanRepository loanRepository;

//    request loan
    public Loan createLoan(Loan loanRequest) {
        return loanRepository.save(loanRequest);
    }

//    display loans requests per user/borrower.
//    Corresponding list of ALL loans -> Paymaster Controller

}
