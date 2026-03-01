package com.lawra.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
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