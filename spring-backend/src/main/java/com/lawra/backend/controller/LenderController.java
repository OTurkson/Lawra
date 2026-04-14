package com.lawra.backend.controller;

import com.lawra.backend.dto.VirtualBankTopUpRequestDTO;
import com.lawra.backend.dto.VirtualBankUpdateRequestDTO;
import com.lawra.backend.dto.VirtualBankDTO;
import com.lawra.backend.model.VirtualBank;
import com.lawra.backend.service.LenderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// VIRTUAL BANKS
@RestController
@RequiredArgsConstructor
@RequestMapping("/banks")
public class LenderController {
    private final LenderService lenderService;

//    Tenant-scoped virtual banks
    @GetMapping
    @PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN') or hasRole('BORROWER')")
    public ResponseEntity<List<VirtualBankDTO>> getAllVirtualBanks () {
        List<VirtualBankDTO> lenders = lenderService.getAllVirtualBanks();
        return ResponseEntity.ok(lenders);
    }

    @PostMapping
    @PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN') or hasRole('BORROWER')")
    public ResponseEntity<VirtualBank> createVirtualBank(@RequestBody VirtualBank virtualBank) {
        VirtualBank createdBank = lenderService.createVirtualBank(virtualBank);
        return ResponseEntity.ok(createdBank);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN') or hasRole('BORROWER')")
    public ResponseEntity<VirtualBank> updateVirtualBank(@PathVariable Long id, @RequestBody VirtualBankUpdateRequestDTO request) {
        return ResponseEntity.ok(lenderService.updateVirtualBank(id, request));
    }

    @PatchMapping("/{id}/top-up")
    @PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN') or hasRole('BORROWER')")
    public ResponseEntity<VirtualBank> topUpVirtualBank(@PathVariable Long id, @RequestBody VirtualBankTopUpRequestDTO request) {
        return ResponseEntity.ok(lenderService.topUpVirtualBank(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN') or hasRole('BORROWER')")
    public ResponseEntity<Void> deleteVirtualBank(@PathVariable Long id) {
        lenderService.deleteVirtualBank(id);
        return ResponseEntity.noContent().build();
    }
}