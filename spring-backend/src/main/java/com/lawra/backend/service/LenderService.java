package com.lawra.backend.service;

import com.lawra.backend.dto.VirtualBankDTO;
import com.lawra.backend.mapper.VirtualBankMapper;
import com.lawra.backend.model.VirtualBank;
import com.lawra.backend.repository.VirtualBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LenderService {
    private final VirtualBankRepository lenderRepository;
    private final VirtualBankMapper virtualBankMapper;

    //    List all VBs
    public List<VirtualBankDTO> getAllVirtualBanks () {
        return lenderRepository.findAll()
                .stream()
                .map(virtualBankMapper::map)
                .toList();
    }

    //    Create new Virtual Bank
    public VirtualBank createVirtualBank(VirtualBank virtualBank) {
        return lenderRepository.save(virtualBank);
    }
}
