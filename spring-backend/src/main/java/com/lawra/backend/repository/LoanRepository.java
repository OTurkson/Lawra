package com.lawra.backend.repository;

import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {
	List<Loan> findByStatus(LoanStatus status);
}
