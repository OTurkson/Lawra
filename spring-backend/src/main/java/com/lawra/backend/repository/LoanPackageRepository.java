package com.lawra.backend.repository;

import com.lawra.backend.model.LoanPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanPackageRepository extends JpaRepository<LoanPackage, Long> {
    boolean existsByVirtualBank_Id(Long virtualBankId);
	List<LoanPackage> findByVirtualBank_Tenant_Id(UUID tenantId);

	List<LoanPackage> findByVirtualBank_Tenant_IdAndVirtualBank_CreatedBy_Id(
			UUID tenantId,
			UUID userId
	);

	Optional<LoanPackage> findByIdAndVirtualBank_Tenant_Id(Long id, UUID tenantId);
}
