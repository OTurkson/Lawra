package com.lawra.backend.enums;

public enum RepaymentStatus {
    PENDING,  // Not yet paid
    PAID,     // Fully paid
    OVERDUE,  // Late payment
    PARTIAL   // Partially paid (if you choose to support it)
}