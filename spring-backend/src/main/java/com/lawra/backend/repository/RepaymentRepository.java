package com.lawra.backend.repository;

import com.lawra.backend.model.Repayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface RepaymentRepository extends JpaRepository<Repayment, Long> {
    @Query("select coalesce(sum(r.amount), 0) from Repayment r where r.loan.id = :loanId")
    BigDecimal totalPaidForLoan(Long loanId);

    List<Repayment> findByLoan_IdOrderByPaidAtDesc(Long loanId);
}
