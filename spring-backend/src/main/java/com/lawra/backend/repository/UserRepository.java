package com.lawra.backend.repository;

import com.lawra.backend.enums.UserRole;
import com.lawra.backend.model.User;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailAndTenantId(String email, UUID tenantId);
    List<User> findByTenant_IdAndRoleIn(UUID tenantId, Collection<UserRole> roles);
}
