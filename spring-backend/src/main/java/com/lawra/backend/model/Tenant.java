package com.lawra.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
public class Tenant {
// include users list. users belong to a tenant by unique email
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // organization (tenant) code
//    private UUID organizationCode;

    @Column(nullable = false, length = 150)
    private String name;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

}
