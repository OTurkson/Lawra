package com.lawra.backend.service;

import com.lawra.backend.dto.LoanPackageDTO;
import com.lawra.backend.mapper.LoanPackageMapper;
import com.lawra.backend.model.LoanPackage;
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

@Service
@RequiredArgsConstructor
public class LoanPackageService {

	private final LoanPackageRepository loanPackageRepository;
	private final VirtualBankRepository virtualBankRepository;
	private final LoanPackageMapper loanPackageMapper;
	private final AuthenticatedUserContextService authenticatedUserContextService;

//	list all loan packages from the virtual banks available
	public List<LoanPackageDTO> getAll() {
		UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
		return loanPackageRepository.findByVirtualBank_Tenant_Id(tenantId)
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
		
		// Validate that loan package balance doesn't exceed virtual bank balance
		if (loanPackage.getBalance().compareTo(bank.getBalance()) > 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
				"Loan package balance cannot exceed virtual bank balance. Available: " + bank.getBalance());
		}
		
		// Deduct loan package balance from virtual bank
		bank.setBalance(bank.getBalance().subtract(loanPackage.getBalance()));
		virtualBankRepository.save(bank);
		
		loanPackage.setVirtualBank(bank);
		return loanPackageRepository.save(loanPackage);
	}

	@Transactional
	public LoanPackage update(Long id, LoanPackage updated) {
		validateLoanPackageName(updated);
		validateLoanPackageBalance(updated);
		LoanPackage existing = getByIdEntity(id);
		VirtualBank existingBank = existing.getVirtualBank();
		VirtualBank updatedBank = resolveTenantScopedBank(updated.getVirtualBank());
		BigDecimal existingBalance = nonNullBalance(existing.getBalance());
		BigDecimal updatedBalance = nonNullBalance(updated.getBalance());

		if (existingBank != null && existingBank.getId() != null && existingBank.getId().equals(updatedBank.getId())) {
			BigDecimal balanceDifference = updatedBalance.subtract(existingBalance);

			if (balanceDifference.compareTo(BigDecimal.ZERO) > 0) {
				BigDecimal availableBalance = nonNullBalance(updatedBank.getBalance());
				if (balanceDifference.compareTo(availableBalance) > 0) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Insufficient virtual bank balance. Available: " + availableBalance);
				}
				updatedBank.setBalance(availableBalance.subtract(balanceDifference));
			} else if (balanceDifference.compareTo(BigDecimal.ZERO) < 0) {
				updatedBank.setBalance(nonNullBalance(updatedBank.getBalance()).add(balanceDifference.negate()));
			}
		} else {
			VirtualBank sourceBank = existingBank != null ? existingBank : updatedBank;
			sourceBank.setBalance(nonNullBalance(sourceBank.getBalance()).add(existingBalance));

			BigDecimal availableBalance = nonNullBalance(updatedBank.getBalance());
			if (updatedBalance.compareTo(availableBalance) > 0) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Insufficient virtual bank balance. Available: " + availableBalance);
			}

			updatedBank.setBalance(availableBalance.subtract(updatedBalance));
			virtualBankRepository.save(sourceBank);
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
}

