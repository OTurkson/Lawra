package com.lawra.backend.controller;

import com.lawra.backend.model.Tenant;
import com.lawra.backend.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
public class TenantController {

	private final TenantService tenantService;

	// CREATE, LIST/GET, UPDATE, DELETE
	@GetMapping
	public ResponseEntity<List<Tenant>> getTenants() {
		return ResponseEntity.ok(tenantService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<Tenant> getTenant(@PathVariable Long id) {
		return ResponseEntity.ok(tenantService.getById(id));
	}

	@PostMapping
	public ResponseEntity<Tenant> createTenant(@RequestBody Tenant tenant) {
		return ResponseEntity.ok(tenantService.create(tenant));
	}

	@PutMapping("/{id}")
	public ResponseEntity<Tenant> updateTenant(@PathVariable Long id, @RequestBody Tenant tenant) {
		return ResponseEntity.ok(tenantService.update(id, tenant));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteTenant(@PathVariable Long id) {
		tenantService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
