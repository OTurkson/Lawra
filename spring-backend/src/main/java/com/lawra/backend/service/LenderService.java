package com.lawra.backend.service;

import com.lawra.backend.dto.VirtualBankTopUpRequestDTO;
import com.lawra.backend.dto.VirtualBankUpdateRequestDTO;
import com.lawra.backend.dto.VirtualBankDTO;
import com.lawra.backend.mapper.VirtualBankMapper;
import com.lawra.backend.model.User;
import com.lawra.backend.model.VirtualBank;
import com.lawra.backend.repository.UserRepository;
import com.lawra.backend.repository.VirtualBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LenderService {
    private final VirtualBankRepository lenderRepository;
    private final UserRepository userRepository;
    private final VirtualBankMapper virtualBankMapper;
    private final AuthenticatedUserContextService authenticatedUserContextService;

    //    List all VBs
    public List<VirtualBankDTO> getAllVirtualBanks () {
        UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
        return lenderRepository.findByTenant_Id(tenantId)
                .stream()
                .map(virtualBankMapper::map)
                .toList();
    }

    //    Create new Virtual Bank
    @Transactional
    public VirtualBank createVirtualBank(VirtualBank virtualBank) {
        // Always derive tenant/user from authentication context to prevent tenant spoofing.
        User currentUser = authenticatedUserContextService.getCurrentUser();
        UUID tenantId = authenticatedUserContextService.getCurrentTenantId();

        // If user already has a virtual bank, bad request
        if (lenderRepository.existsByCreatedBy_IdAndTenant_Id(currentUser.getId(), tenantId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User already owns a virtual bank");
        }

        BigDecimal initialDeposit = normalizeInitialDeposit(virtualBank.getBalance());

        ensureSufficientUserBalance(currentUser, initialDeposit);

        currentUser.setBalance(currentUser.getBalance().subtract(initialDeposit));

        virtualBank.setTenant(authenticatedUserContextService.getCurrentTenant());
        virtualBank.setCreatedBy(currentUser);
        virtualBank.setBalance(initialDeposit);

        return lenderRepository.save(virtualBank);
    }

    @Transactional
    public VirtualBank updateVirtualBank(Long id, VirtualBankUpdateRequestDTO request) {
        VirtualBank bank = getTenantBank(id);
        User currentUser = authenticatedUserContextService.getCurrentUser();

        ensureCanManageBank(currentUser, bank);

        if (request.getName() == null || request.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Virtual bank name is required");
        }

        bank.setName(request.getName().trim());
        return lenderRepository.save(bank);
    }

    @Transactional
    public VirtualBank topUpVirtualBank(Long id, VirtualBankTopUpRequestDTO request) {
        VirtualBank bank = getTenantBank(id);
        User currentUser = authenticatedUserContextService.getCurrentUser();

        ensureCanManageBank(currentUser, bank);

        BigDecimal amount = normalizeRequiredAmount(request.getAmount());
        ensureSufficientUserBalance(currentUser, amount);

        currentUser.setBalance(currentUser.getBalance().subtract(amount));
        bank.setBalance(bank.getBalance().add(amount));

        return lenderRepository.save(bank);
    }

    @Transactional
    public void deleteVirtualBank(Long id) {
        VirtualBank bank = getTenantBank(id);
        User currentUser = authenticatedUserContextService.getCurrentUser();

        ensureCanManageBank(currentUser, bank);
        BigDecimal refundAmount = bank.getBalance() == null ? BigDecimal.ZERO : bank.getBalance();
        User refundTarget = bank.getCreatedBy() != null ? bank.getCreatedBy() : currentUser;

        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal currentBalance = refundTarget.getBalance() == null ? BigDecimal.ZERO : refundTarget.getBalance();
            refundTarget.setBalance(currentBalance.add(refundAmount));
            userRepository.save(refundTarget);
        }

        lenderRepository.delete(bank);
    }

    private VirtualBank  getTenantBank(Long id) {
        UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
        return lenderRepository.findByIdAndTenant_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Virtual bank not found"));
    }

    private void ensureCanManageBank(User currentUser, VirtualBank bank) {
        boolean isOwner = bank.getCreatedBy().getId().equals(currentUser.getId());

        if (!isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own virtual banks");
        }
    }

    private BigDecimal normalizeInitialDeposit(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }
        return amount;
    }

    private BigDecimal normalizeRequiredAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }
        return amount;
    }

    private void ensureSufficientUserBalance(User currentUser, BigDecimal amount) {
        BigDecimal currentBalance = currentUser.getBalance() == null ? BigDecimal.ZERO : currentUser.getBalance();
        System.out.println(currentBalance);
        if (currentBalance.compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance for this action");
        }
    }
}