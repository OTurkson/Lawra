package com.lawra.backend.repository;

import com.lawra.backend.model.LoanPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanPackageRepository extends JpaRepository<LoanPackage, Long> {
	List<LoanPackage> findByVirtualBank_Tenant_Id(UUID tenantId);

	Optional<LoanPackage> findByIdAndVirtualBank_Tenant_Id(Long id, UUID tenantId);
}
