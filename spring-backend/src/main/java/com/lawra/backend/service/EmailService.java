package com.lawra.backend.service;

import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.model.Loan;
import com.lawra.backend.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:no-reply@lawra.local}")
    private String fromAddress;

    @Value("${app.frontend.reset-password-url-base:http://localhost:5173/reset-password}")
    private String resetPasswordUrlBase;

    public void sendAccountCreationEmail(User user) {
        sendMessage(user.getEmail(),
                "Welcome to Lawra",
                buildWelcomeBody(user),
                "account creation");
    }

    public void sendAccountCreationEmail(User user, String token) {
        sendMessage(user.getEmail(),
                "Your Lawra account is ready",
                buildAccountSetupBody(user, token),
                "account setup");
    }

    public void sendPasswordResetEmail(User user, String token) {
        sendMessage(user.getEmail(),
                "Set your Lawra password",
                buildAccountSetupBody(user, token),
                "password reset");
    }

    public void sendLoanDecisionEmail(User borrower, Loan loan) {
        LoanStatus status = loan.getStatus();
        if (status != LoanStatus.APPROVED && status != LoanStatus.REJECTED) {
            return;
        }

        String subject = status == LoanStatus.APPROVED ? "Your loan was approved" : "Your loan was rejected";
        String loanPackageName = loan.getLoanPackage() != null && loan.getLoanPackage().getName() != null
                ? loan.getLoanPackage().getName()
                : "your loan package";
        String decidedBy = loan.getApprovedBy() != null && loan.getApprovedBy().getFullName() != null
                ? loan.getApprovedBy().getFullName()
                : "the finance team";
        BigDecimal amount = loan.getPrincipalAmount();
        String amountText = amount != null ? amount.toPlainString() : "0";

        String body = "Hello " + borrower.getFullName() + ",\n\n"
                + "Your loan request has been " + status.name().toLowerCase() + ".\n\n"
                + "Loan details:\n"
                + "- Package: " + loanPackageName + "\n"
                + "- Amount: Gh¢ " + amountText + "\n"
                + "- Status: " + status + "\n"
                + "- Reviewed by: " + decidedBy + "\n\n"
                + "If you have questions, please contact your admin or finance team.";

        sendMessage(borrower.getEmail(), subject, body, "loan decision");
    }

    public void sendLoanRequestEmail(User borrower, Loan loan) {
        String subject = "Your loan request was received";
        String body = buildLoanRequestBody(borrower, loan);
        sendMessage(borrower.getEmail(), subject, body, "loan request");
    }

    public void sendLoanApprovalEmail(User borrower, User paymaster, Loan loan) {
        if (loan.getStatus() != LoanStatus.APPROVED) {
            return;
        }

        String borrowerSubject = "Your loan was approved";
        String borrowerBody = buildLoanDecisionBody(borrower, loan, "approved");
        sendMessage(borrower.getEmail(), borrowerSubject, borrowerBody, "loan approval");

        if (paymaster != null && paymaster.getEmail() != null && !paymaster.getEmail().isBlank()) {
            String paymasterSubject = "Loan approval processed";
            String paymasterBody = buildPaymasterApprovalBody(paymaster, borrower, loan);
            sendMessage(paymaster.getEmail(), paymasterSubject, paymasterBody, "loan approval receipt");
        }
    }

    private String buildWelcomeBody(User user) {
        return "Hello " + user.getFullName() + ",\n\n"
                + "Your Lawra account has been created successfully.\n"
                + "You can now sign in with the password you chose during signup.\n\n"
                + "If you did not expect this email, you can safely ignore it.";
    }

    private String buildAccountSetupBody(User user, String token) {
        String resetLink = buildResetLink(token);

        return "Hello " + user.getFullName() + ",\n\n"
                + "Your Lawra account has been created.\n"
                + "Please use the link below to set or reset your password before logging in:\n\n"
                + resetLink + "\n\n"
                + "This link expires in 24 hours.\n\n"
                + "If you did not expect this email, you can safely ignore it.";
    }

            private String buildLoanRequestBody(User borrower, Loan loan) {
            String loanPackageName = loan.getLoanPackage() != null && loan.getLoanPackage().getName() != null
                ? loan.getLoanPackage().getName()
                : "your loan package";
            String amountText = loan.getPrincipalAmount() != null ? loan.getPrincipalAmount().toPlainString() : "0";

            return "Hello " + borrower.getFullName() + ",\n\n"
                + "We received your loan request.\n\n"
                + "Request details:\n"
                + "- Package: " + loanPackageName + "\n"
                + "- Amount: Gh¢ " + amountText + "\n"
                + "- Interest: " + (loan.getInterestRate() != null ? loan.getInterestRate().toPlainString() : "0") + "%\n"
                + "- Status: PENDING\n\n"
                + "We will notify you once it has been reviewed.";
            }

            private String buildLoanDecisionBody(User borrower, Loan loan, String decision) {
            String loanPackageName = loan.getLoanPackage() != null && loan.getLoanPackage().getName() != null
                ? loan.getLoanPackage().getName()
                : "your loan package";
            String decidedBy = loan.getApprovedBy() != null && loan.getApprovedBy().getFullName() != null
                ? loan.getApprovedBy().getFullName()
                : "the finance team";
            BigDecimal amount = loan.getPrincipalAmount();
            String amountText = amount != null ? amount.toPlainString() : "0";

            return "Hello " + borrower.getFullName() + ",\n\n"
                + "Your loan request has been " + decision + ".\n\n"
                + "Loan details:\n"
                + "- Package: " + loanPackageName + "\n"
                + "- Amount: Gh¢ " + amountText + "\n"
                + "- Status: " + loan.getStatus() + "\n"
                + "- Reviewed by: " + decidedBy + "\n\n"
                + "If you have questions, please contact your admin or finance team.";
            }

            private String buildPaymasterApprovalBody(User paymaster, User borrower, Loan loan) {
            String amountText = loan.getPrincipalAmount() != null ? loan.getPrincipalAmount().toPlainString() : "0";
            String loanPackageName = loan.getLoanPackage() != null && loan.getLoanPackage().getName() != null
                ? loan.getLoanPackage().getName()
                : "your loan package";

            return "Hello " + paymaster.getFullName() + ",\n\n"
                + "You approved a loan request successfully.\n\n"
                + "Loan details:\n"
                + "- Borrower: " + borrower.getFullName() + "\n"
                + "- Package: " + loanPackageName + "\n"
                + "- Amount: Gh¢ " + amountText + "\n"
                + "- Status: " + loan.getStatus() + "\n\n"
                + "The borrower has also been notified.";
            }

    private String buildResetLink(String token) {
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        return resetPasswordUrlBase + "?token=" + encodedToken;
    }

    private void sendMessage(String to, String subject, String body, String context) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        if (!mailEnabled) {
            log.info("Mail disabled for {} notification to {} with subject '{}'", context, to, subject);
            return;
        }

        try {
            mailSender.send(message);
            log.info("Sent {} notification to {}", context, to);
        } catch (MailException ex) {
            log.warn("Failed to send {} notification to {}: {}", context, to, ex.getMessage());
        }
    }

}
