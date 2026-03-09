package com.lawra.backend.controller;

import com.lawra.backend.dto.VirtualBankDTO;
import com.lawra.backend.model.VirtualBank;
import com.lawra.backend.service.LenderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<VirtualBankDTO>> getAllVirtualBanks () {
        List<VirtualBankDTO> lenders = lenderService.getAllVirtualBanks();
        return ResponseEntity.ok(lenders);
    }

    @PostMapping
    public ResponseEntity<VirtualBank> createVirtualBank(@RequestBody VirtualBank virtualBank) {
        VirtualBank createdBank = lenderService.createVirtualBank(virtualBank);
        return ResponseEntity.ok(createdBank);
    }
}