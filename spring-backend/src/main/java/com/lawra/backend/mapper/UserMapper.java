package com.lawra.backend.mapper;

import com.lawra.backend.dto.UserResponseDTO;
import com.lawra.backend.model.User;
import com.lawra.backend.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMapper {
    private final AccountService accountService;

    public UserResponseDTO map(User user) {
        UserResponseDTO dto = new UserResponseDTO();

        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setBalance(accountService.balanceOf(user));
        dto.setRole(user.getRole().toString());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        return dto;
    }
}
