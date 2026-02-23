package com.lawra.backend.model;


import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
public class Loan {
//    include tenant id. all loans belong to a tenant
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, length = 150)
    private String fullName;

    //    Tenant associated with a particular user
    @OneToOne (cascade = CascadeType.ALL)
    private Tenant tenant;

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
