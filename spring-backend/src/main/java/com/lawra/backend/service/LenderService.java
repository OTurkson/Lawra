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
    private final VirtualBankMapper virtualBankMapper;
    private final AuthenticatedUserContextService authenticatedUserContextService;
    private final AccountService accountService;

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

        throw new ResponseStatusException(HttpStatus.METHOD_NOT_ALLOWED,
                "Accounts are provisioned automatically when a user is created");
    }

    @Transactional
    public VirtualBank updateVirtualBank(Long id, VirtualBankUpdateRequestDTO request) {
        VirtualBank bank = getTenantBank(id);
        User currentUser = authenticatedUserContextService.getCurrentUser();

        ensureCanManageBank(currentUser, bank);

        throw new ResponseStatusException(HttpStatus.METHOD_NOT_ALLOWED,
                "Account names are managed from the user profile");
    }

    @Transactional
    public VirtualBank topUpVirtualBank(Long id, VirtualBankTopUpRequestDTO request) {
        VirtualBank bank = getTenantBank(id);
        User currentUser = authenticatedUserContextService.getCurrentUser();

        ensureCanManageBank(currentUser, bank);

        BigDecimal amount = normalizeRequiredAmount(request.getAmount());
        if (bank.getCreatedBy() != null && !bank.getCreatedBy().getId().equals(currentUser.getId())) {
            accountService.debit(currentUser, amount);
        }
        bank.setBalance((bank.getBalance() == null ? BigDecimal.ZERO : bank.getBalance()).add(amount));

        return lenderRepository.save(bank);
    }

    @Transactional
    public void deleteVirtualBank(Long id) {
        VirtualBank bank = getTenantBank(id);
        User currentUser = authenticatedUserContextService.getCurrentUser();

        ensureCanManageBank(currentUser, bank);
        throw new ResponseStatusException(HttpStatus.METHOD_NOT_ALLOWED,
                "User accounts cannot be deleted independently of the user");
    }

    private VirtualBank  getTenantBank(Long id) {
        UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
        return lenderRepository.findByIdAndTenant_Id(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Virtual bank not found"));
    }

    private void ensureCanManageBank(User currentUser, VirtualBank bank) {
        boolean isOwner = bank.getCreatedBy() != null && bank.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == com.lawra.backend.enums.UserRole.ADMIN
                || currentUser.getRole() == com.lawra.backend.enums.UserRole.PAYMASTER;

        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own virtual banks");
        }
    }

    private BigDecimal normalizeRequiredAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }
        return amount;
    }

}
