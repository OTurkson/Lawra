package com.lawra.backend.controller;

import com.lawra.backend.model.VirtualBank;
import com.lawra.backend.service.LenderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// VIRTUAL BANKS
@RestController
@RequiredArgsConstructor
@RequestMapping("/banks")
public class LenderController {
    private final LenderService lenderService;

//    Create, get (list), update, delete VB
    @GetMapping
    public ResponseEntity<List<VirtualBank>> getAllVirtualBanks () {
        List<VirtualBank> lenders = lenderService.getAllVirtualBanks();
        return ResponseEntity.ok(lenders);
    }

    @PostMapping
    public ResponseEntity<Virtual>
}
