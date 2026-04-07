package com.lawra.backend.service;

import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.model.VirtualBank;
import com.lawra.backend.repository.LoanPackageRepository;
import com.lawra.backend.repository.VirtualBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LoanPackageService {

	private final LoanPackageRepository loanPackageRepository;
	private final VirtualBankRepository virtualBankRepository;
	private final AuthenticatedUserContextService authenticatedUserContextService;

//	list all loan packages from the virtual banks available
	public List<LoanPackage> getAll() {
		UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
		return loanPackageRepository.findByVirtualBank_Tenant_Id(tenantId);
	}

	public LoanPackage getById(Long id) {
		UUID tenantId = authenticatedUserContextService.getCurrentTenantId();
		return loanPackageRepository.findByIdAndVirtualBank_Tenant_Id(id, tenantId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan package not found"));
	}

	public LoanPackage create(LoanPackage loanPackage) {
		VirtualBank bank = resolveTenantScopedBank(loanPackage.getVirtualBank());
		loanPackage.setVirtualBank(bank);
		return loanPackageRepository.save(loanPackage);
	}

	public LoanPackage update(Long id, LoanPackage updated) {
		LoanPackage existing = getById(id);
		existing.setBalance(updated.getBalance());
		existing.setInterestRate(updated.getInterestRate());
		existing.setVirtualBank(resolveTenantScopedBank(updated.getVirtualBank()));
		return loanPackageRepository.save(existing);
	}

	public void delete(Long id) {
		LoanPackage existing = getById(id);
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
}

