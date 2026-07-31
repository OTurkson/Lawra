package com.lawra.backend.service;

import com.lawra.backend.dto.LoanPackageDTO;
import com.lawra.backend.mapper.LoanPackageMapper;
import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.model.User;
import com.lawra.backend.model.VirtualBank;
import com.lawra.backend.repository.LoanPackageRepository;
import com.lawra.backend.repository.VirtualBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.lawra.backend.enums.UserRole;

@Service
@RequiredArgsConstructor
public class LoanPackageService {

	private final LoanPackageRepository loanPackageRepository;
	private final VirtualBankRepository virtualBankRepository;
	private final LoanPackageMapper loanPackageMapper;
	private final AuthenticatedUserContextService authenticatedUserContextService;
	private final AccountService accountService;

//	list all loan packages from the virtual banks available
	public List<LoanPackageDTO> getAll() {
		UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
		return loanPackageRepository.findByVirtualBank_Tenant_Id(tenantId)
				.stream()
				.map(loanPackageMapper::map)
				.toList();
	}

//	list all loan packages belonging to a particular user
	public List<LoanPackageDTO> getAllLoanPackagesPerUser() {
		UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
		User currentUser = authenticatedUserContextService.getCurrentUser();

		if (currentUser.getRole() == UserRole.PAYMASTER || currentUser.getRole() == UserRole.ADMIN) {
			return loanPackageRepository.findByVirtualBank_Tenant_Id(tenantId)
					.stream()
					.map(loanPackageMapper::map)
					.toList();
		}
		return loanPackageRepository.findByVirtualBank_Tenant_IdAndVirtualBank_CreatedBy_Id(tenantId, currentUser.getId())
				.stream()
				.map(loanPackageMapper::map)
				.toList();
	}

	public LoanPackageDTO getById(Long id) {
		UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
		LoanPackage loanPackage = loanPackageRepository.findByIdAndVirtualBank_Tenant_Id(id, tenantId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan package not found"));
		return loanPackageMapper.map(loanPackage);
	}

	private LoanPackage getByIdEntity(Long id) {
		UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
		return loanPackageRepository.findByIdAndVirtualBank_Tenant_Id(id, tenantId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan package not found"));
	}

	@Transactional
	public LoanPackage create(LoanPackage loanPackage) {
		validateLoanPackageName(loanPackage);
		VirtualBank bank = resolveTenantScopedBank(loanPackage.getVirtualBank());
		ensureCanManageBank(bank);
		User currentUser = authenticatedUserContextService.getCurrentUser();
		
		// Validate that loan package balance doesn't exceed virtual bank balance
		if (!isFundingAnotherUser(currentUser, bank)
				&& loanPackage.getBalance().compareTo(bank.getBalance()) > 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
				"Loan package balance cannot exceed virtual bank balance. Available: " + bank.getBalance());
		}
		
		// Deduct loan package balance from virtual bank
		if (isFundingAnotherUser(currentUser, bank)) {
			accountService.debit(currentUser, loanPackage.getBalance());
		} else {
			bank.setBalance(bank.getBalance().subtract(loanPackage.getBalance()));
			virtualBankRepository.save(bank);
		}
		
		loanPackage.setVirtualBank(bank);
		return loanPackageRepository.save(loanPackage);
	}

	@Transactional
	public LoanPackage update(Long id, LoanPackage updated) {
		validateLoanPackageName(updated);
		validateLoanPackageBalance(updated);
		LoanPackage existing = getByIdEntity(id);
		ensureCanManageLoanPackage(existing);
		User currentUser = authenticatedUserContextService.getCurrentUser();
		VirtualBank existingBank = existing.getVirtualBank();
		VirtualBank updatedBank = resolveTenantScopedBank(updated.getVirtualBank());
		BigDecimal existingBalance = nonNullBalance(existing.getBalance());
		BigDecimal updatedBalance = nonNullBalance(updated.getBalance());

		if (existingBank != null && existingBank.getId() != null && existingBank.getId().equals(updatedBank.getId())) {
			BigDecimal balanceDifference = updatedBalance.subtract(existingBalance);

			if (balanceDifference.compareTo(BigDecimal.ZERO) > 0) {
				if (isFundingAnotherUser(currentUser, updatedBank)) {
					accountService.debit(currentUser, balanceDifference);
				} else {
					BigDecimal availableBalance = nonNullBalance(updatedBank.getBalance());
					if (balanceDifference.compareTo(availableBalance) > 0) {
						throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"Insufficient virtual bank balance. Available: " + availableBalance);
					}
					updatedBank.setBalance(availableBalance.subtract(balanceDifference));
				}
			} else if (balanceDifference.compareTo(BigDecimal.ZERO) < 0) {
				updatedBank.setBalance(nonNullBalance(updatedBank.getBalance()).add(balanceDifference.negate()));
			}
		} else {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"A loan package cannot be moved between user wallets");
		}

		virtualBankRepository.save(updatedBank);
		existing.setName(updated.getName());
		existing.setBalance(updatedBalance);
		existing.setInterestRate(updated.getInterestRate());
		existing.setVirtualBank(updatedBank);
		return loanPackageRepository.save(existing);
	}

	@Transactional
	public void delete(Long id) {
		LoanPackage existing = getByIdEntity(id);
		ensureCanManageLoanPackage(existing);
		VirtualBank bank = existing.getVirtualBank();
		
		// Refund loan package balance back to virtual bank
		bank.setBalance(bank.getBalance().add(existing.getBalance()));
		virtualBankRepository.save(bank);
		
		loanPackageRepository.delete(existing);
	}

	private VirtualBank resolveTenantScopedBank(VirtualBank bank) {
		if (bank == null || bank.getId() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Virtual bank is required");
		}

		VirtualBank resolved = virtualBankRepository.findById(bank.getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Virtual bank not found"));

		if (!resolved.getTenant().getId().equals(authenticatedUserContextService.getCurrentTenantId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot use virtual bank from another tenant");
		}

		return resolved;
	}

	private void ensureCanManageBank(VirtualBank bank) {
		User currentUser = authenticatedUserContextService.getCurrentUser();
		boolean isOwner = bank.getCreatedBy() != null && bank.getCreatedBy().getId().equals(currentUser.getId());
		boolean isAdmin = currentUser.getRole() == UserRole.ADMIN || currentUser.getRole() == UserRole.PAYMASTER;

		if (!isOwner && !isAdmin) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage loan packages on your own virtual banks");
		}
	}

	private void ensureCanManageLoanPackage(LoanPackage loanPackage) {
		User currentUser = authenticatedUserContextService.getCurrentUser();
		VirtualBank bank = loanPackage.getVirtualBank();
		boolean isOwner = bank != null && bank.getCreatedBy() != null && bank.getCreatedBy().getId().equals(currentUser.getId());
		boolean isAdmin = currentUser.getRole() == UserRole.ADMIN || currentUser.getRole() == UserRole.PAYMASTER;

		if (!isOwner && !isAdmin) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own loan packages");
		}
	}

	private void validateLoanPackageName(LoanPackage loanPackage) {
		if (loanPackage.getName() == null || loanPackage.getName().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loan package name is required");
		}
	}

	private void validateLoanPackageBalance(LoanPackage loanPackage) {
		if (loanPackage.getBalance() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loan package balance is required");
		}
		if (loanPackage.getBalance().compareTo(BigDecimal.ZERO) < 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loan package balance cannot be negative");
		}
	}

	private BigDecimal nonNullBalance(BigDecimal balance) {
		return balance != null ? balance : BigDecimal.ZERO;
	}

	private boolean isFundingAnotherUser(User currentUser, VirtualBank targetBank) {
		return targetBank.getCreatedBy() != null
				&& !targetBank.getCreatedBy().getId().equals(currentUser.getId());
	}
}

