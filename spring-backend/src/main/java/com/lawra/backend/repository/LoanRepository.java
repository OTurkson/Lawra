package com.lawra.backend.repository;

import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.model.Loan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanRepository extends JpaRepository<Loan, Long> {
	List<Loan> findByStatus(LoanStatus status);

	List<Loan> findByBorrower_Id(UUID borrowerId);

	List<Loan> findByBorrower_Tenant_Id(UUID tenantId);

	List<Loan> findByStatusAndBorrower_Tenant_Id(LoanStatus status, UUID tenantId);

	Optional<Loan> findByIdAndBorrower_Tenant_Id(Long id, UUID tenantId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select loan from Loan loan where loan.id = :id and loan.borrower.tenant.id = :tenantId")
	Optional<Loan> findByIdAndTenantIdForRepayment(@Param("id") Long id,
	                                               @Param("tenantId") UUID tenantId);

	List<Loan> findByBorrower_IdAndBorrower_Tenant_Id(UUID borrowerId, UUID tenantId);
}
