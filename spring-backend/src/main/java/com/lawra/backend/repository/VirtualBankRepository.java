package com.lawra.backend.repository;

import com.lawra.backend.model.VirtualBank;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VirtualBankRepository extends JpaRepository<VirtualBank, Long> {
    List<VirtualBank> findByTenant_Id(UUID tenantId);

    Optional<VirtualBank> findByIdAndTenant_Id(Long id, UUID tenantId);

    Optional<VirtualBank> findByCreatedBy_IdAndTenant_Id(UUID userId, UUID tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<VirtualBank> findForUpdateByCreatedBy_IdAndTenant_Id(UUID userId, UUID tenantId);

    boolean existsByCreatedBy_IdAndTenant_Id(UUID userId, UUID tenantId);
}
