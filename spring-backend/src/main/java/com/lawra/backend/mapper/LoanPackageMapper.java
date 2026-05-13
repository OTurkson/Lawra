package com.lawra.backend.mapper;

import com.lawra.backend.dto.LoanPackageDTO;
import com.lawra.backend.model.LoanPackage;
import org.springframework.stereotype.Component;

@Component
public class LoanPackageMapper {
    private final VirtualBankMapper virtualBankMapper;

    public LoanPackageMapper(VirtualBankMapper virtualBankMapper) {
        this.virtualBankMapper = virtualBankMapper;
    }

    public LoanPackageDTO map(LoanPackage loanPackage) {
        if (loanPackage == null) {
            return null;
        }

        return new LoanPackageDTO(
                loanPackage.getId(),
                loanPackage.getBalance(),
                loanPackage.getInterestRate(),
                loanPackage.getVirtualBank() != null 
                    ? virtualBankMapper.map(loanPackage.getVirtualBank()) 
                    : null
        );
    }
}
