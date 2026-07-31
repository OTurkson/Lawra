package com.lawra.backend.service;

import com.lawra.backend.dto.InviteUserRequestDTO;
import com.lawra.backend.dto.UserBalanceTopUpRequestDTO;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final TenantRepository tenantRepository;
    private final EmailService emailService;
    private final PasswordResetService passwordResetService;
    private final AuthenticatedUserContextService authenticatedUserContextService;
    private final AccountService accountService;

    // list all users
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream().map(userMapper::map).collect(Collectors.toList());
    }

    // create a user (for self-signup or admin creation with explicit password)
    public UserResponseDTO createUser(SignupUserRequestDTO userRequestDTO) {
        String email = requireText(userRequestDTO.getEmail(), "Email is required");
        String fullName = requireText(userRequestDTO.getFullName(), "Full name is required");
        String phoneNumber = requireText(userRequestDTO.getPhoneNumber(), "Phone number is required");

        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPhoneNumber(phoneNumber);
        if (userRequestDTO.getPassword() == null || userRequestDTO.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required for self-signup");
        }

        user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));
        user.setRole(userRequestDTO.getRole() != null ? userRequestDTO.getRole() : UserRole.BORROWER);
        user.setPasswordResetRequired(false); // User provided their own password

        UUID tenantId = userRequestDTO.getTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant selection is required");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant with id " + tenantId + " not found"));
        user.setTenant(tenant);

        ensureEmailIsAvailable(email, tenantId, null);

        User savedUser = saveUserEntity(user);
        accountService.provision(savedUser);
        emailService.sendAccountCreationEmail(savedUser);
        return userMapper.map(savedUser);
    }

    /**
     * Provision a user created by a Paymaster with a temporary password.
     * User receives email with reset link and MUST reset password before logging in.
     * Auto-derives tenant from authenticated paymaster's token context.
     */
    public UserResponseDTO provisionUser(UserRequestDTO request) {
        Tenant tenant = authenticatedUserContextService.getCurrentTenant();
        String email = requireText(request.getEmail(), "Email is required");
        String fullName = requireText(request.getFullName(), "Full name is required");
        String phoneNumber = requireText(request.getPhoneNumber(), "Phone number is required");

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is not accepted when provisioning users");
        }

        ensureEmailIsAvailable(email, tenant.getId(), null);

        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPhoneNumber(phoneNumber);

        // Generate a temporary random password
        String temporaryPassword = UUID.randomUUID().toString();
        user.setPassword(passwordEncoder.encode(temporaryPassword));

        // Set role to BORROWER (provisioned users are borrowers)
        user.setRole(UserRole.BORROWER);
        
        // CRITICAL: Mark user as requiring password reset
        user.setPasswordResetRequired(true);
        
        user.setTenant(tenant);

        User savedUser = saveUserEntity(user);
        accountService.provision(savedUser);

        String token = passwordResetService.createResetToken(savedUser);
        emailService.sendAccountCreationEmail(savedUser, token);

        return userMapper.map(savedUser);
    }

    // Invite a user created from the admin portal and email them a reset link
    public UserResponseDTO inviteUser(InviteUserRequestDTO request) {
        String email = requireText(request.getEmail(), "Email is required");
        String fullName = requireText(request.getFullName(), "Full name is required");
        String phoneNumber = requireText(request.getPhoneNumber(), "Phone number is required");

        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPhoneNumber(phoneNumber);

        // Generate a random temporary password
        String temporaryPassword = UUID.randomUUID().toString();
        user.setPassword(passwordEncoder.encode(temporaryPassword));

        user.setRole(UserRole.BORROWER);
        user.setPasswordResetRequired(true);

        Tenant tenant = authenticatedUserContextService.getCurrentTenant();
        user.setTenant(tenant);

        ensureEmailIsAvailable(email, tenant.getId(), null);

        User savedUser = saveUserEntity(user);
        accountService.provision(savedUser);

        String token = passwordResetService.createResetToken(savedUser);
        emailService.sendAccountCreationEmail(savedUser, token);

        return userMapper.map(savedUser);
    }

    // get a single user
    public UserResponseDTO getUserById(UUID id) {
        return userRepository.findById(id).map(userMapper::map).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"User with id " + id + " not found"));
    }

    // update a user
    public UserResponseDTO updateUser(UserRequestDTO userRequestDTO, UUID id) {
        User currentUser = authenticatedUserContextService.getCurrentUser();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User with id " + id + " not found"));

        boolean isTenantAdmin = currentUser.getRole() == UserRole.PAYMASTER || currentUser.getRole() == UserRole.ADMIN;
        boolean isSelf = currentUser.getId().equals(id);

        if (!isTenantAdmin && !isSelf) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to update this account");
        }

        boolean hasChanges = false;

        if (isTenantAdmin) {
            String email = trimmedValue(userRequestDTO.getEmail());
            if (email != null && !email.equals(user.getEmail())) {
                ensureEmailIsAvailable(email, user.getTenant().getId(), user.getId());
                user.setEmail(email);
                hasChanges = true;
            }
            String fullName = trimmedValue(userRequestDTO.getFullName());
            if (fullName != null && !fullName.equals(user.getFullName())) {
                user.setFullName(fullName);
                hasChanges = true;
            }
        }

        String phoneNumber = trimmedValue(userRequestDTO.getPhoneNumber());
        if (phoneNumber != null && !phoneNumber.equals(user.getPhoneNumber())) {
            user.setPhoneNumber(phoneNumber);
            hasChanges = true;
        }

        // Optional: update password if provided
        if (userRequestDTO.getPassword() != null && !userRequestDTO.getPassword().isBlank()) {
            if (passwordEncoder.matches(userRequestDTO.getPassword(), user.getPassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different from the current password");
            }
            user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));
            user.setPasswordResetRequired(false);
            hasChanges = true;
        }

        if (!hasChanges) {
            return userMapper.map(user);
        }

        User savedUser = saveUserEntity(user);
        if (hasChanges && userRequestDTO.getFullName() != null) {
            accountService.syncAccountName(savedUser);
        }
        return userMapper.map(savedUser);
    }

    @Transactional
    public UserResponseDTO topUpCurrentUserBalance(UserBalanceTopUpRequestDTO request) {
        User currentUser = authenticatedUserContextService.getCurrentUser();
        BigDecimal amount = normalizeAmount(request.getAmount());

        accountService.credit(currentUser, amount);
        return userMapper.map(currentUser);
    }

    public void deleteUser(UUID id) {
        User currentUser = authenticatedUserContextService.getCurrentUser();
        boolean isTenantAdmin = currentUser.getRole() == UserRole.PAYMASTER || currentUser.getRole() == UserRole.ADMIN;
        if (!isTenantAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to delete users");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User with id " + id + " not found"));

        if (user.getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own account");
        }

        accountService.deleteWithUser(user);
        userRepository.delete(user);
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }

        return amount;
    }

    private void ensureEmailIsAvailable(String email, UUID tenantId, UUID currentUserId) {
        userRepository.findByEmailAndTenantId(email, tenantId).ifPresent(existing -> {
            if (currentUserId == null || !existing.getId().equals(currentUserId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with this email already exists in this tenant");
            }
        });
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private String trimmedValue(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private User saveUserEntity(User user) {
        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with this email already exists in this tenant");
        }
    }

}
