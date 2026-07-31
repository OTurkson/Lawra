package com.lawra.backend.service;

import com.lawra.backend.model.User;
import com.lawra.backend.model.VirtualBank;
import com.lawra.backend.repository.VirtualBankRepository;
import com.lawra.backend.repository.LoanPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

/** Owns the single financial account assigned to every user. */
@Service
@RequiredArgsConstructor
public class                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 AccountService {
    private final VirtualBankRepository virtualBankRepository;
    private final LoanPackageRepository loanPackageRepository;

    @Transactional
    public VirtualBank provision(User user) {
        return virtualBankRepository.findByCreatedBy_IdAndTenant_Id(user.getId(), user.getTenant().getId())
                .orElseGet(() -> {
                    VirtualBank account = new VirtualBank();
                    account.setName(user.getFullName());
                    account.setCreatedBy(user);
                    account.setTenant(user.getTenant());
                    account.setBalance(BigDecimal.ZERO);
                    return virtualBankRepository.save(account);
                });
    }

    public VirtualBank getAccount(User user) {
        return virtualBankRepository.findByCreatedBy_IdAndTenant_Id(user.getId(), user.getTenant().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "User account has not been provisioned"));
    }

    @Transactional
    public VirtualBank credit(User user, BigDecimal amount) {
        requirePositive(amount);
        VirtualBank account = getAccount(user);
        account.setBalance(balanceOf(account).add(amount));
        return virtualBankRepository.save(account);
    }

    @Transactional
    public VirtualBank debit(User user, BigDecimal amount) {
        requirePositive(amount);
        VirtualBank account = getAccount(user);
        if (balanceOf(account).compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient account balance");
        }
        account.setBalance(balanceOf(account).subtract(amount));
        return virtualBankRepository.save(account);
    }

    @Transactional
    public void syncAccountName(User user) {
        VirtualBank account = getAccount(user);
        account.setName(user.getFullName());
        virtualBankRepository.save(account);
    }

    @Transactional
    public void deleteWithUser(User user) {
        VirtualBank account = getAccount(user);
        if (loanPackageRepository.existsByVirtualBank_Id(account.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "User cannot be deleted while their account has loan packages");
        }
        virtualBankRepository.delete(account);
    }

    public BigDecimal balanceOf(User user) { return balanceOf(getAccount(user)); }
    public BigDecimal balanceOf(VirtualBank account) { return account.getBalance() == null ? BigDecimal.ZERO : account.getBalance(); }

    private void requirePositive(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }
    }
}
