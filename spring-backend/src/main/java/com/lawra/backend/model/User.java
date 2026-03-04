package com.lawra.backend.model;

import com.lawra.backend.enums.UserRole;
import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
//"users" because MySQL has a default user table
@Table(name="users",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"tenant_id", "email"}
    )
)
@FilterDef(
    name = "tenantFilter",
    parameters = @ParamDef(name = "tenantId", type = Long.class)
)
@Filter(
    name = "tenantFilter",
    condition = "tenant_id = :tenantId"
)

public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 150)
    private String password;

    @Column(nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false)
    private String phoneNumber;

//    Tenant associated with a particular user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role; // Role from UserRole enum

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
