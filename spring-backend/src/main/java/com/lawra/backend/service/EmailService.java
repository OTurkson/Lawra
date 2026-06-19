package com.lawra.backend.service;

import com.lawra.backend.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@lawra.local}")
    private String fromAddress;

    @Value("${app.frontend.reset-password-url-base:http://localhost:5173/reset-password}")
    private String resetPasswordUrlBase;

    //  send OTP to confirm email while creating account


    //  send "account created" email (both admin and user)
    public void sendAccountCreationEmail(User user, String token) {
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        String resetLink = resetPasswordUrlBase + "?token=" + encodedToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(user.getEmail());
        message.setSubject("Account Created Successfully!");
        message.setText(
                "Hello " + user.getFullName() + ",\n\n" +
                        "An account has been created for you on Lawra" +
                        "Use this link to reset your password before you can login:\n\n" +
                         resetLink+ "\n\n" +
                        "This link expires in 24 hours.\n\n" +
                        "If you did not expect this email, you can safely ignore it."
        );

        mailSender.send(message);
    }

    public void sendPasswordResetEmail(User user, String token) {
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        String resetLink = resetPasswordUrlBase + "?token=" + encodedToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(user.getEmail());
        message.setSubject("Set your Lawra password");
        message.setText(
                "Hello " + user.getFullName() + ",\n\n" +
                "An account has been created for you on Lawra or a password reset was requested. " +
                "To set your password, please click the link below:\n\n" +
                resetLink + "\n\n" +
                "If you did not expect this email, you can safely ignore it."
        );

        System.out.println(resetLink);

        mailSender.send(message);
    }


//  
}
