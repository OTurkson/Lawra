package com.lawra.backend.model;

import com.lawra.backend.enums.UserRole;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name="users") //users
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role; // Role from UserRole enum

    @Column(nullable = false)
    private String phoneNumber;

//    Code for the organization the borrower belongs to (tenant)
    @Column(length = 100)
    private String organizationCode;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


//  UNDERSTAND THESE, AND FIND OUT IF "THIS" KEYWORD IS NECESSARY FOR THE VARIABLES UNDER THIS
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
