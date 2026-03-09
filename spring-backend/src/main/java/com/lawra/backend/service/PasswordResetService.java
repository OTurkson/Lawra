package com.lawra.backend.service;

import com.lawra.backend.model.PasswordResetToken;
import com.lawra.backend.model.User;
import com.lawra.backend.repository.PasswordResetTokenRepository;
import com.lawra.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.security.password-reset-token-expiry-hours:24}")
    private long tokenExpiryHours;

    public void createAndSendResetToken(User user) {
        // Remove any existing tokens for this user to keep only the latest one valid
        tokenRepository.deleteByUser(user);

        String tokenValue = UUID.randomUUID().toString();

        PasswordResetToken token = new PasswordResetToken();
        token.setToken(tokenValue);
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusHours(tokenExpiryHours));
        token.setUsed(false);

        tokenRepository.save(token);

        emailService.sendPasswordResetEmail(user, tokenValue);
    }

    public void resetPassword(String tokenValue, String newPassword) {
        PasswordResetToken token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or unknown reset token"));

        if (token.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token has already been used");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token has expired");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);
    }
}
