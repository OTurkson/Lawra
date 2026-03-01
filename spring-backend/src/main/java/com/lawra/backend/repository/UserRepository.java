package com.lawra.backend.repository;

import com.lawra.backend.model.User;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailAndTenantId(String email, Long tenantId);
}