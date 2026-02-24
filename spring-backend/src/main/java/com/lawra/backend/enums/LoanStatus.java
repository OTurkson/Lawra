package com.lawra.backend.enums;

public enum LoanStatus {
    PENDING,    // Just applied, waiting for Paymaster
    APPROVED,   // Approved and subsequently disbursed
    REJECTED,   // Application rejected
    COMPLETED,  // Fully repaid
    DEFAULTED   // Not (fully) repaid / overdue beyond limit
}