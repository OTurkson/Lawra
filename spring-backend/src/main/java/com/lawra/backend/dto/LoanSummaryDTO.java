package com.lawra.backend.dto;

import com.lawra.backend.enums.LoanStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class LoanSummaryDTO {
    private Long id;
    private String borrowerName;
    private BigDecimal amount;
    private String interest;
    private String virtualBank;
    private String tenure;
    private BigDecimal installment;
    private String bank;
    private String accountName;
    private String accountNumber;
    private LoanStatus status;
}
