package com.lawra.backend.repository;

import com.lawra.backend.model.LoanPackage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanPackageRepository extends JpaRepository<LoanPackage, Long> {
}
