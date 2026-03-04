package com.lawra.backend.model;


import com.lawra.backend.enums.LoanPeriod;
import com.lawra.backend.enums.LoanStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Loan {
    //    include tenant id. all loans belong to a tenant
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //    Loan Package the loan comes from
    @ManyToOne
    @JoinColumn(nullable = false)
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

//    loan status
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status =  LoanStatus.PENDING;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime lastModified;
}
