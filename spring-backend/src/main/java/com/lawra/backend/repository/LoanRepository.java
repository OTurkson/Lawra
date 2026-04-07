package com.lawra.backend.repository;

import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanRepository extends JpaRepository<Loan, Long> {
	List<Loan> findByStatus(LoanStatus status);

	List<Loan> findByBorrower_Id(UUID borrowerId);

	List<Loan> findByBorrower_Tenant_Id(UUID tenantId);

	List<Loan> findByStatusAndBorrower_Tenant_Id(LoanStatus status, UUID tenantId);

	Optional<Loan> findByIdAndBorrower_Tenant_Id(Long id, UUID tenantId);

	List<Loan> findByBorrower_IdAndBorrower_Tenant_Id(UUID borrowerId, UUID tenantId);
}
