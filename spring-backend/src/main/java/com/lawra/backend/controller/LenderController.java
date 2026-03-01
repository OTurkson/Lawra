package com.lawra.backend.controller;

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

//    Create, get (list), update, delete VB - Only PAYMASTER can manage virtual banks
    @GetMapping
    @PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN')")
    public ResponseEntity<List<VirtualBank>> getAllVirtualBanks () {
        List<VirtualBank> lenders = lenderService.getAllVirtualBanks();
        return ResponseEntity.ok(lenders);
    }

    @PostMapping
    @PreAuthorize("hasRole('PAYMASTER') or hasRole('ADMIN')")
    public ResponseEntity<VirtualBank> createVirtualBank(@RequestBody VirtualBank virtualBank) {
        VirtualBank createdBank = lenderService.createVirtualBank(virtualBank);
        return ResponseEntity.ok(createdBank);
    }
}