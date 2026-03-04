package com.lawra.backend.service;

import com.lawra.backend.model.Tenant;
import com.lawra.backend.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TenantService {

	private final TenantRepository tenantRepository;

	public List<Tenant> getAll() {
		return tenantRepository.findAll();
	}

	public Tenant getById(Long id) {
		return tenantRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found"));
	}

	public Tenant create(Tenant tenant) {
		return tenantRepository.save(tenant);
	}

	public Tenant update(Long id, Tenant tenant) {
		Tenant existing = getById(id);
		existing.setName(tenant.getName());
		return tenantRepository.save(existing);
	}

	public void delete(Long id) {
		Tenant existing = getById(id);
		tenantRepository.delete(existing);
	}
}

