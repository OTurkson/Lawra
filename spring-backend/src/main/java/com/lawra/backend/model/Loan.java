package com.lawra.backend.model;


import com.lawra.backend.enums.LoanPeriod;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class Loan {
    //    include tenant id. all loans belong to a tenant
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //    Loan Package the loan comes from
    @OneToOne (cascade = CascadeType.ALL)
    private LoanPackage loanPackage;

    // Principal amount at approval time
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal principalAmount;

    // Interest rate at the time of loan approval (per annum)
    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal interestRate;

    // Loan duration
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanPeriod period;

    // Final repayment amount (principal + interest)
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal totalRepaymentAmount;

    // Loan due date (derived from period but stored for stability)
    @Column(nullable = false)
    private LocalDate dueDate;

//    user and time created/updated
    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    private User borrower;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
