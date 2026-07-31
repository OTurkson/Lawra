package com.lawra.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
public class Repayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    /** The employee whose wallet funded this payment. */
    // Nullable only to keep legacy repayment rows readable during the schema update.
    // New repayments are always assigned a payer by BorrowerService.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paid_by_id", columnDefinition = "CHAR(36)")
    private User paidBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime paidAt;
}
