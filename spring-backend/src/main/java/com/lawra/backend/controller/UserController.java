package com.lawra.backend.controller;

import com.lawra.backend.dto.InviteUserRequestDTO;
import com.lawra.backend.dto.UserRequestDTO;
import com.lawra.backend.dto.UserResponseDTO;
import com.lawra.backend.model.User;
import com.lawra.backend.repository.UserRepository;
import com.lawra.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class        UserController {

    private final UserRepository userRepository;

    private final UserService userService;

//    create, read, update, delete users - Only ADMIN and PAYMASTER can manage users
    @GetMapping
//    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER')")
    public ResponseEntity<List<UserResponseDTO>> getUsers() {
        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PostMapping
//    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER')")
    public ResponseEntity<UserResponseDTO> createUser(@RequestBody UserRequestDTO userRequestDTO) {
        UserResponseDTO userResponseDTO = userService.createUser(userRequestDTO);
        return ResponseEntity.ok(userResponseDTO);
    }

    // Admin-only: invite a user and send them a password reset email to set their own password
    @PostMapping("/invite")
//    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER')")
    public ResponseEntity<UserResponseDTO> inviteUser(@RequestBody InviteUserRequestDTO request) {
        UserResponseDTO userResponseDTO = userService.inviteUser(request);
        return ResponseEntity.ok(userResponseDTO);
    }

    @GetMapping("/{id}")
//    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER')")
    public ResponseEntity<UserResponseDTO> getUser(@PathVariable Long id) {
        UserResponseDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
//    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER')")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Long id, @RequestBody UserRequestDTO userRequestDTO) {
        UserResponseDTO userResponseDTO = userService.updateUser(userRequestDTO, id);
        return ResponseEntity.ok(userResponseDTO);
    }

    @DeleteMapping("/{id}")
//    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

}
