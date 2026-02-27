package com.lawra.backend.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LoanPeriod {

    THREE_MONTHS(91),
    SIX_MONTHS(182),
    ONE_YEAR(365);

    private final int days;
}