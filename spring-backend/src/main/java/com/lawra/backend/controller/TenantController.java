package com.lawra.backend.controller;

import com.lawra.backend.model.Tenant;
import com.lawra.backend.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
public class TenantController {

	private final TenantService tenantService;

	// CREATE, LIST/GET, UPDATE. Tenant deletion is reserved for a future
	// system-wide administrator workflow and is deliberately not exposed here.
	@GetMapping
	public ResponseEntity<List<Tenant>> getTenants() {
		return ResponseEntity.ok(tenantService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<Tenant> getTenant(@PathVariable UUID id) {
		return ResponseEntity.ok(tenantService.getById(id));
	}

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Tenant> createTenant(@RequestBody Tenant tenant) {
		return ResponseEntity.ok(tenantService.create(tenant));
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Tenant> updateTenant(@PathVariable UUID id, @RequestBody Tenant tenant) {
		return ResponseEntity.ok(tenantService.update(id, tenant));
	}

}
