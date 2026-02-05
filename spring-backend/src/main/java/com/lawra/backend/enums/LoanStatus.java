package com.lawra.backend.enums;

public enum LoanStatus {
    PENDING,    // Just applied, waiting for Paymaster
    APPROVED,   // Approved but not yet disbursed
    REJECTED,   // Application rejected
    DISBURSED,  // Money sent to borrower
    ACTIVE,     // Being repaid
    COMPLETED,  // Fully repaid
    DEFAULTED   // Not repaid / overdue beyond limit
}