package com.lawra.backend.repository;

import com.lawra.backend.model.VirtualBank;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VirtualBankRepository extends JpaRepository<VirtualBank, Long> {
}
