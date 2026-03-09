package com.lawra.backend.mapper;

import com.lawra.backend.dto.UserResponseDTO;
import com.lawra.backend.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponseDTO map(User user) {
        UserResponseDTO dto = new UserResponseDTO();

        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setRole(user.getRole().toString());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        return dto;
    }
}
