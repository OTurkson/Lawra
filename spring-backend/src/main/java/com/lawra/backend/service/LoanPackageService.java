package com.lawra.backend.service;

import com.lawra.backend.model.LoanPackage;
import com.lawra.backend.repository.LoanPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanPackageService {

	private final LoanPackageRepository loanPackageRepository;

	public List<LoanPackage> getAll() {
		return loanPackageRepository.findAll();
	}

	public LoanPackage getById(Long id) {
		return loanPackageRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan package not found"));
	}

	public LoanPackage create(LoanPackage loanPackage) {
		return loanPackageRepository.save(loanPackage);
	}

	public LoanPackage update(Long id, LoanPackage updated) {
		LoanPackage existing = getById(id);
		existing.setBalance(updated.getBalance());
		existing.setInterestRate(updated.getInterestRate());
		existing.setVirtualBank(updated.getVirtualBank());
		return loanPackageRepository.save(existing);
	}

	public void delete(Long id) {
		LoanPackage existing = getById(id);
		loanPackageRepository.delete(existing);
	}
}

