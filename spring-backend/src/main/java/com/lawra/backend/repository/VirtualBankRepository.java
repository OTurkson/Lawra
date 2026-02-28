package com.lawra.backend.repository;

import com.lawra.backend.model.VirtualBank;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VirtualBankRepository extends JpaRepository<VirtualBank, Long> {
    List<VirtualBank> findByTenantId(Long tenantId);
}
