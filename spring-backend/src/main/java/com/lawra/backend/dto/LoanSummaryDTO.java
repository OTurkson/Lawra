package com.lawra.backend.dto;

import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.enums.RepaymentStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class LoanSummaryDTO {
    private Long id;
    private UUID borrowerId;
    private String borrowerName;
    private BigDecimal amount;
    private String interest;
    private String loanPackage;
    private String virtualBank;
    private String tenure;
    private BigDecimal repaymentAmount;
    private BigDecimal totalPaid;
    private BigDecimal outstandingAmount;
    private RepaymentStatus repaymentStatus;
    private LocalDate dueDate;
    private String bank;
    private String approvedBy;
    private LoanStatus status;
}
