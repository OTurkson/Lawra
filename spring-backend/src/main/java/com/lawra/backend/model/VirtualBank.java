package com.lawra.backend.model;

import com.lawra.backend.enums.UserRole;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

public class VirtualBank {
//    include tenant id. each virtual bank belongs to a tenant
//    same thing for user_id
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    //    Tenant associated with a particular user
    @OneToOne(cascade = CascadeType.ALL)
    private Tenant organization;

    @OneToOne(cascade = CascadeType.ALL)
    private User user;

    @Column(length = 100)
    private double balance;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

}
