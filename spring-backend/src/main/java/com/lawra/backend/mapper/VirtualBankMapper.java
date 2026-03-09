package com.lawra.backend.mapper;

import com.lawra.backend.dto.VirtualBankDTO;
import com.lawra.backend.model.VirtualBank;
import org.hibernate.annotations.Comment;
import org.springframework.stereotype.Component;

@Component
public class VirtualBankMapper {
    //    Map virtual bank DTO -> entity
    public VirtualBankDTO map(VirtualBank bank) {
        return new VirtualBankDTO(
                bank.getId(),
                bank.getName(),
                bank.getBalance(),
                bank.getCreatedBy().getFullName(),
                bank.getTenant().getName()
        );
    }
}
