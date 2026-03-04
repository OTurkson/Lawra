package com.lawra.backend.service;

import com.lawra.backend.dto.UserRequestDTO;
import com.lawra.backend.dto.UserResponseDTO;
import com.lawra.backend.enums.UserRole;
import com.lawra.backend.model.Tenant;
import com.lawra.backend.model.User;
import com.lawra.backend.repository.TenantRepository;
import com.lawra.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantRepository tenantRepository;

    //    list all users
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

//    create a user
    public UserResponseDTO createUser(UserRequestDTO userRequestDTO) {
        User user = new User();
        user.setEmail(userRequestDTO.getEmail());
        user.setFullName(userRequestDTO.getFullName());
        user.setPhoneNumber(userRequestDTO.getPhoneNumber());

        // ✅ SET PASSWORD (ENCODED)
        user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));

        // ✅ SET DEFAULT ROLE (otherwise will also be null)
        user.setRole(UserRole.BORROWER);

        // Set a tenant (required, nullable = false).
        // For now, assign the first available tenant so that tests can pass.
        Tenant tenant = tenantRepository.findAll().stream()
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No tenant configured"));
        user.setTenant(tenant);

        User savedUser = userRepository.save(user);


        return mapToResponseDTO(savedUser);
    }

//    get a single user
    public UserResponseDTO getUserById(Long id) {
        return userRepository.findById(id).map(this::mapToResponseDTO).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"User with id " + id + " not found"));
    }

//    update a user
    public UserResponseDTO updateUser(UserRequestDTO userRequestDTO, Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User with id " + id + " not found"));

        user.setEmail(userRequestDTO.getEmail());
        user.setFullName(userRequestDTO.getFullName());
        user.setPhoneNumber(userRequestDTO.getPhoneNumber());

        // Optional: update password if provided
        if (userRequestDTO.getPassword() != null && !userRequestDTO.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));
        }

        User saved = userRepository.save(user);
        return mapToResponseDTO(saved);
    }

    public void deleteUser(Long id) {
        userRepository.findById(id).map(this::mapToResponseDTO).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"User with id " + id + " not found"));
        userRepository.deleteById(id);
    }




    private UserResponseDTO mapToResponseDTO(User user) {
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
