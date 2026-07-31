package com.lawra.backend.model;

import com.lawra.backend.enums.UserRole;
import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.*;

import java.time.LocalDateTime;
import java.util.UUID;

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
    parameters = @ParamDef(name = "tenantId", type = String.class)
)
@Filter(
    name = "tenantFilter",
    condition = "tenant_id = :tenantId"
)

public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 150)
    private String password;

    @Column(nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false)
    private String phoneNumber;

    @OneToOne(mappedBy = "createdBy", fetch = FetchType.LAZY)
    private VirtualBank virtualBank;

//    Tenant associated with a particular user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role; // Role from UserRole enum

    @Column(nullable = false)
    private Boolean passwordResetRequired = true; // New users must reset password

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
