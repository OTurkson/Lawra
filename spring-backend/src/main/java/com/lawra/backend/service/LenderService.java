package com.lawra.backend.service;

import com.lawra.backend.model.VirtualBank;
import com.lawra.backend.repository.VirtualBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LenderService {
    private final VirtualBankRepository lenderRepository;

    //    List all VBs
    public List<VirtualBank> getAllVirtualBanks () {
        return lenderRepository.findAll();
    }

}
