package com.lawra.backend.service;

import com.lawra.backend.dto.InviteUserRequestDTO;
import com.lawra.backend.dto.SignupUserRequestDTO;
import com.lawra.backend.dto.UserRequestDTO;
import com.lawra.backend.dto.UserResponseDTO;
import com.lawra.backend.enums.UserRole;
import com.lawra.backend.mapper.UserMapper;
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
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final TenantRepository tenantRepository;
    private final PasswordResetService passwordResetService;
    private final AuthenticatedUserContextService authenticatedUserContextService;

    // list all users
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream().map(userMapper::map).collect(Collectors.toList());
    }

    // create a user (for self-signup or admin creation with explicit password)
    public UserResponseDTO createUser(SignupUserRequestDTO userRequestDTO) {
        User user = new User();
        user.setEmail(userRequestDTO.getEmail());
        user.setFullName(userRequestDTO.getFullName());
        user.setPhoneNumber(userRequestDTO.getPhoneNumber());
        if (userRequestDTO.getPassword() == null || userRequestDTO.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required for self-signup");
        }

        user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));
        user.setRole(UserRole.BORROWER);
        user.setPasswordResetRequired(false); // User provided their own password

        UUID tenantId = userRequestDTO.getTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant selection is required");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant with id " + tenantId + " not found"));
        user.setTenant(tenant);

        User savedUser = userRepository.save(user);
        return userMapper.map(savedUser);
    }

    /**
     * Provision a user created by a Paymaster with a temporary password.
     * User receives email with reset link and MUST reset password before logging in.
     * Auto-derives tenant from authenticated paymaster's token context.
     */
    public UserResponseDTO provisionUser(UserRequestDTO request) {
        Tenant tenant = authenticatedUserContextService.getCurrentTenant();

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());

        // Generate a temporary random password
        String temporaryPassword = UUID.randomUUID().toString();
        user.setPassword(passwordEncoder.encode(temporaryPassword));

        // Set role to BORROWER (provisioned users are borrowers)
        user.setRole(UserRole.BORROWER);
        
        // CRITICAL: Mark user as requiring password reset
        user.setPasswordResetRequired(true);
        
        user.setTenant(tenant);

        User savedUser = userRepository.save(user);

        // Send password reset email so user can set their own password
        passwordResetService.createAndSendResetToken(savedUser);

        return userMapper.map(savedUser);
    }

    // Invite a user created from the admin portal and email them a reset link
    public UserResponseDTO inviteUser(InviteUserRequestDTO request) {
        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());

        // Generate a random temporary password
        String temporaryPassword = UUID.randomUUID().toString();
        user.setPassword(passwordEncoder.encode(temporaryPassword));

        user.setRole(UserRole.BORROWER);
        user.setPasswordResetRequired(true);

        Tenant tenant = authenticatedUserContextService.getCurrentTenant();
        user.setTenant(tenant);

        User savedUser = userRepository.save(user);

        // Create a one-time reset token and send email so the user sets their own password
        passwordResetService.createAndSendResetToken(savedUser);

        return userMapper.map(savedUser);
    }

    // get a single user
    public UserResponseDTO getUserById(UUID id) {
        return userRepository.findById(id).map(userMapper::map).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"User with id " + id + " not found"));
    }

    // update a user
    public UserResponseDTO updateUser(UserRequestDTO userRequestDTO, UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User with id " + id + " not found"));

        user.setEmail(userRequestDTO.getEmail());
        user.setFullName(userRequestDTO.getFullName());
        user.setPhoneNumber(userRequestDTO.getPhoneNumber());

        // Optional: update password if provided
        if (userRequestDTO.getPassword() != null && !userRequestDTO.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));
            user.setPasswordResetRequired(false);
        }

        User saved = userRepository.save(user);
        return userMapper.map(saved);
    }

    public void deleteUser(UUID id) {
        userRepository.findById(id).map(userMapper::map).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"User with id " + id + " not found"));
        userRepository.deleteById(id);
    }

}
