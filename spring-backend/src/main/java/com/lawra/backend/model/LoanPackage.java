package com.lawra.backend.model;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
public class LoanPackage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    private VirtualBank virtualBank;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal balance;

    @Column(nullable = false, precision = 5, scale = 2)
    private double interestRate;
}