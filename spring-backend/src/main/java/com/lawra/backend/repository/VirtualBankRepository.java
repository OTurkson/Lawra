package com.lawra.backend.repository;

import com.lawra.backend.model.VirtualBank;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VirtualBankRepository extends JpaRepository<VirtualBank, Long> {
    List<VirtualBank> findByTenant_Id(UUID tenantId);
}
