package com.lawra.backend.controller;

import com.lawra.backend.dto.InviteUserRequestDTO;
import com.lawra.backend.dto.SignupUserRequestDTO;
import com.lawra.backend.dto.UserRequestDTO;
import com.lawra.backend.dto.UserResponseDTO;
import com.lawra.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    // Get all users - ADMIN or PAYMASTER only
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER')")
    public ResponseEntity<List<UserResponseDTO>> getUsers() {
        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // Create a user with explicit password (self-signup)
    @PostMapping
    public ResponseEntity<UserResponseDTO> createUser(@RequestBody SignupUserRequestDTO userRequestDTO) {
        UserResponseDTO userResponseDTO = userService.createUser(userRequestDTO);
        return ResponseEntity.ok(userResponseDTO);
    }

    // PAYMASTER: Provision a user within their tenant
    // User receives email with password reset link and MUST reset password before login
    @PostMapping("/provision")
    @PreAuthorize("hasRole('PAYMASTER')")
    public ResponseEntity<UserResponseDTO> provisionUser(@RequestBody UserRequestDTO request) {
        UserResponseDTO userResponseDTO = userService.provisionUser(request);
        return ResponseEntity.ok(userResponseDTO);
    }

    // Admin-only: invite a user and send them a password reset email
    @PostMapping("/invite")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> inviteUser(@RequestBody InviteUserRequestDTO request) {
        UserResponseDTO userResponseDTO = userService.inviteUser(request);
        return ResponseEntity.ok(userResponseDTO);
    }

    // Get a single user by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER') or #id.toString() == authentication.principal.userId.toString()")
    public ResponseEntity<UserResponseDTO> getUser(@PathVariable UUID id) {
        UserResponseDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    // Update a user
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER') or #id.toString() == authentication.principal.userId.toString()")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable UUID id, @RequestBody UserRequestDTO userRequestDTO) {
        UserResponseDTO userResponseDTO = userService.updateUser(userRequestDTO, id);
        return ResponseEntity.ok(userResponseDTO);
    }

    // Delete a user - tenant admin roles only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER')")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

}
