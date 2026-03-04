package com.lawra.backend.config;

import com.lawra.backend.enums.LoanPeriod;
import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.enums.UserRole;
import com.lawra.backend.model.*;
import com.lawra.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final VirtualBankRepository virtualBankRepository;
    private final LoanPackageRepository loanPackageRepository;
    private final LoanRepository loanRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedDemoData() {
        return args -> {
            if (tenantRepository.count() > 0L) {
                // Assume data already exists; do not duplicate
                return;
            }

            log.info("Seeding demo data for Lawra application");

            // Tenant
            Tenant tenant = new Tenant();
            tenant.setName("Unilever Ghana");
            tenant = tenantRepository.save(tenant);

            // Users
            User borrower = new User();
            borrower.setEmail("borrower@unilever.test");
            borrower.setFullName("Nana Yaw");
            borrower.setPhoneNumber("0240000001");
            borrower.setPassword(passwordEncoder.encode("password"));
            borrower.setRole(UserRole.BORROWER);
            borrower.setTenant(tenant);
            borrower = userRepository.save(borrower);

            User paymaster = new User();
            paymaster.setEmail("paymaster@unilever.test");
            paymaster.setFullName("Mama One");
            paymaster.setPhoneNumber("0240000002");
            paymaster.setPassword(passwordEncoder.encode("password"));
            paymaster.setRole(UserRole.PAYMASTER);
            paymaster.setTenant(tenant);
            paymaster = userRepository.save(paymaster);

            // Virtual bank
            VirtualBank bank = new VirtualBank();
            bank.setName("Abusia Funds");
            bank.setTenant(tenant);
            bank.setCreatedBy(paymaster);
            bank.setBalance(new BigDecimal("20000.00"));
            bank = virtualBankRepository.save(bank);

            // Loan package linked to virtual bank
            LoanPackage loanPackage = new LoanPackage();
            loanPackage.setVirtualBank(bank);
            loanPackage.setBalance(new BigDecimal("20000.00"));
            loanPackage.setInterestRate(new BigDecimal("12.50"));
            loanPackage = loanPackageRepository.save(loanPackage);

            // Pending loan
            Loan pendingLoan = Loan.builder()
                    .loanPackage(loanPackage)
                    .principalAmount(new BigDecimal("700.00"))
                    .interestRate(new BigDecimal("12.50"))
                    .period(LoanPeriod.SIX_MONTHS)
                    .totalRepaymentAmount(new BigDecimal("840.00"))
                    .dueDate(LocalDate.now().plusDays(LoanPeriod.SIX_MONTHS.getDays()))
                    .borrower(borrower)
                    .status(LoanStatus.PENDING)
                    .build();
            loanRepository.save(pendingLoan);

            // Approved loan
            Loan approvedLoan = Loan.builder()
                    .loanPackage(loanPackage)
                    .principalAmount(new BigDecimal("1500.00"))
                    .interestRate(new BigDecimal("10.50"))
                    .period(LoanPeriod.ONE_YEAR)
                    .totalRepaymentAmount(new BigDecimal("1800.00"))
                    .dueDate(LocalDate.now().plusDays(LoanPeriod.ONE_YEAR.getDays()))
                    .borrower(borrower)
                    .status(LoanStatus.APPROVED)
                    .build();
            loanRepository.save(approvedLoan);

            log.info("Demo data created: tenant={}, borrower={}, paymaster={}, bank={}",
                    tenant.getId(), borrower.getId(), paymaster.getId(), bank.getId());
        };
    }
}
    