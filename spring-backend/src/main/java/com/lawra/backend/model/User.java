package com.lawra.backend.model;

import com.lawra.backend.enums.UserRole;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name="users") //users because MySQL has a default user table
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, length = 150)
    private String password;

    @Column(nullable = false, length = 150)
    private String fullName;

//    Tenant associated with a particular user
    @OneToOne (cascade = CascadeType.ALL)
    private Tenant tenant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role; // Role from UserRole enum

    @Column(nullable = false)
    private String phoneNumber;

//    Code for the organization the borrower belongs to (tenant)
    @Column(length = 100)
    private String organizationCode;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

}
