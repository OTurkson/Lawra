package com.lawra.backend.service;

import com.lawra.backend.enums.LoanStatus;
import com.lawra.backend.enums.UserRole;
import com.lawra.backend.model.Loan;
import com.lawra.backend.model.User;
import com.lawra.backend.repository.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private static final String GREEN = "#1f7a42";
    private static final String DEEP_GREEN = "#105a31";
    private static final String TEXT = "#1d2a24";

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:no-reply@lawra.local}")
    private String fromAddress;

    @Value("${app.frontend.reset-password-url-base:http://localhost:5173/reset-password}")
    private String resetPasswordUrlBase;

    @Value("${app.public-base-url:http://localhost:8080}")
    private String publicBaseUrl;

    public void sendAccountCreationEmail(User user) {
        boolean employee = user.getRole() == UserRole.BORROWER;
        EmailContent content = new EmailContent(
                "WELCOME TO LAWRA",
                "Your account is ready.",
                "Hello " + safeName(user) + ", your Lawra " + (employee ? "employee account and wallet have" : "account has") + " been created.",
                detailCard(List.of(
                        new Detail("Account role", roleName(user)),
                        new Detail(employee ? "Your wallet" : "Access", "Ready to use"),
                        new Detail("What's next", employee
                                ? "Sign in and explore available loan packages"
                                : "Sign in to manage your Lawra workspace"))),
                "Go to Lawra",
                null,
                employee ? "5_personal.png" : "4_business.png",
                employee ? "Your employee wallet is available whenever you need it." : "Your Lawra workspace is ready.");
        sendEmail(user.getEmail(), "Welcome to Lawra", content, "account creation");
    }

    public void sendAccountCreationEmail(User user, String token) {
        boolean employee = user.getRole() == UserRole.BORROWER;
        EmailContent content = new EmailContent(
                "YOUR ACCOUNT IS READY",
                "Set your password to begin.",
                "Hello " + safeName(user) + ", your Lawra " + (employee ? "employee account and wallet are" : "account is") + " ready for you.",
                detailCard(List.of(
                        new Detail("Secure setup link", "Expires in 24 hours"),
                        new Detail("Account role", roleName(user)),
                        new Detail("Your account", employee
                                ? "One wallet, borrowing and lending in one place"
                                : "Secure access to your Lawra workspace"))),
                "Set password",
                buildResetLink(token),
                "2_signup-hero.jpg",
                "If you did not expect this invitation, you can safely ignore this email.");
        sendEmail(user.getEmail(), "Your Lawra account is ready", content, "account setup");
    }

    public void sendPasswordResetEmail(User user, String token) {
        EmailContent content = new EmailContent(
                "PASSWORD RESET",
                "Secure your Lawra account.",
                "Hello " + safeName(user) + ", use the secure link below to choose a new password.",
                detailCard(List.of(new Detail("Reset link", "Expires in 24 hours"))),
                "Reset password",
                buildResetLink(token),
                "7_icon-bulb.png",
                "For your protection, do not forward this email or share the link.");
        sendEmail(user.getEmail(), "Set your Lawra password", content, "password reset");
    }

    public void sendLoanRequestEmail(User borrower, Loan loan) {
        EmailContent content = new EmailContent(
                "LOAN REQUEST RECEIVED",
                "Your request is with the team.",
                "Hello " + safeName(borrower) + ", we received your loan request and will notify you after it is reviewed.",
                loanDetails(loan, "Pending review"),
                null,
                null,
                "3_student.png",
                "You can keep track of your request from the Loans section in Lawra.");
        sendEmail(borrower.getEmail(), "Your loan request was received", content, "loan request");

        userRepository.findByTenant_IdAndRoleIn(
                        borrower.getTenant().getId(), List.of(UserRole.PAYMASTER, UserRole.ADMIN))
                .stream()
                .filter(reviewer -> !reviewer.getId().equals(borrower.getId()))
                .filter(reviewer -> reviewer.getEmail() != null && !reviewer.getEmail().isBlank())
                .forEach(reviewer -> {
                    EmailContent reviewerContent = new EmailContent(
                            "LOAN REQUEST NEEDS REVIEW",
                            "A new employee loan is waiting.",
                            "Hello " + safeName(reviewer) + ", " + safeName(borrower) + " submitted a loan request for review.",
                            loanDetails(loan, "Pending your review"),
                            null,
                            null,
                            "4_business.png",
                            "Review the request from the Loans section in Lawra.");
                    sendEmail(reviewer.getEmail(), "Loan request needs review", reviewerContent, "loan review request");
                });
    }

    public void sendLoanDecisionEmail(User borrower, Loan loan) {
        if (loan.getStatus() != LoanStatus.APPROVED && loan.getStatus() != LoanStatus.REJECTED) {
            return;
        }

        boolean approved = loan.getStatus() == LoanStatus.APPROVED;
        EmailContent content = new EmailContent(
                approved ? "LOAN APPROVED" : "LOAN UPDATE",
                approved ? "Your loan has been approved." : "Your loan request was not approved.",
                approved
                        ? "Hello " + safeName(borrower) + ", your funds have been added to your Lawra wallet."
                        : "Hello " + safeName(borrower) + ", the finance team was unable to approve this request at this time.",
                loanDetails(loan, approved ? "Approved" : "Not approved"),
                approved ? "View your loans" : null,
                null,
                approved ? "4_business.png" : "8_icon-shield.png",
                approved
                        ? "Your repayment schedule is available in the Loans section."
                        : "You may contact your Paymaster for more information.");
        sendEmail(borrower.getEmail(), approved ? "Your loan was approved" : "Your loan request update", content, "loan decision");
    }

    public void sendLoanDecisionEmail(User borrower, User reviewer, Loan loan) {
        if (loan.getStatus() != LoanStatus.APPROVED && loan.getStatus() != LoanStatus.REJECTED) {
            return;
        }

        sendLoanDecisionEmail(borrower, loan);

        if (reviewer != null && reviewer.getEmail() != null && !reviewer.getEmail().isBlank()) {
            boolean approved = loan.getStatus() == LoanStatus.APPROVED;
            EmailContent content = new EmailContent(
                    approved ? "LOAN APPROVAL RECORDED" : "LOAN DECISION RECORDED",
                    approved ? "You approved a loan request." : "You declined a loan request.",
                    "Hello " + safeName(reviewer) + ", your decision for " + safeName(borrower) + " has been recorded.",
                    detailCard(List.of(
                            new Detail("Employee", safeName(borrower)),
                            new Detail("Package", loanPackageName(loan)),
                            new Detail("Loan amount", money(loan.getPrincipalAmount())),
                            new Detail("Decision", approved ? "Approved" : "Not approved"))),
                    null,
                    null,
                    approved ? "7_icon-bulb.png" : "8_icon-shield.png",
                    "The employee has received their decision notification.");
            sendEmail(reviewer.getEmail(), approved ? "Loan approval processed" : "Loan decision processed",
                    content, "loan decision receipt");
        }
    }

    public void sendRepaymentEmail(User borrower, User payer, Loan loan, BigDecimal amount,
                                   BigDecimal outstandingAfterPayment) {
        boolean completed = outstandingAfterPayment.compareTo(BigDecimal.ZERO) == 0;
        EmailContent content = new EmailContent(
                completed ? "LOAN FULLY REPAID" : "REPAYMENT RECEIVED",
                completed ? "Your loan is now complete." : "Your repayment was recorded.",
                "Hello " + safeName(borrower) + ", " + money(amount) + " was applied to your loan.",
                repaymentDetails(loan, payer, amount, outstandingAfterPayment),
                null, null,
                completed ? "7_icon-bulb.png" : "3_student.png",
                completed ? "Thank you. No further payment is due for this loan."
                        : "You can view your updated repayment history in Lawra.");
        sendEmail(borrower.getEmail(), completed ? "Your loan is fully repaid" : "Loan repayment received",
                content, "loan repayment");

        userRepository.findByTenant_IdAndRoleIn(
                        borrower.getTenant().getId(), List.of(UserRole.PAYMASTER, UserRole.ADMIN))
                .stream()
                .filter(reviewer -> !reviewer.getId().equals(borrower.getId()))
                .filter(reviewer -> reviewer.getEmail() != null && !reviewer.getEmail().isBlank())
                .forEach(reviewer -> {
                    EmailContent reviewerContent = new EmailContent(
                            completed ? "LOAN CLOSED" : "LOAN REPAYMENT RECORDED",
                            completed ? "An employee loan has been fully repaid." : "A repayment has been received.",
                            "Hello " + safeName(reviewer) + ", a payment was recorded for " + safeName(borrower) + ".",
                            repaymentDetails(loan, payer, amount, outstandingAfterPayment),
                            null, null, "4_business.png",
                            completed ? "The loan status is now Completed." : "The loan remains active until fully repaid.");
                    sendEmail(reviewer.getEmail(), completed ? "Employee loan fully repaid" : "Employee loan repayment",
                            reviewerContent, "finance repayment notification");
                });
    }

    private String repaymentDetails(Loan loan, User payer, BigDecimal amount, BigDecimal outstanding) {
        return detailCard(List.of(
                new Detail("Employee", safeName(loan.getBorrower())),
                new Detail("Loan package", loanPackageName(loan)),
                new Detail("Payment", money(amount)),
                new Detail("Paid by", safeName(payer)),
                new Detail("Outstanding", money(outstanding.max(BigDecimal.ZERO))),
                new Detail("Status", outstanding.compareTo(BigDecimal.ZERO) == 0 ? "Completed" : "Approved")));
    }

    private String loanDetails(Loan loan, String status) {
        String reviewedBy = loan.getApprovedBy() == null ? "Finance team" : safeName(loan.getApprovedBy());
        return detailCard(List.of(
                new Detail("Loan package", loanPackageName(loan)),
                new Detail("Requested amount", money(loan.getPrincipalAmount())),
                new Detail("Interest", loan.getInterestRate() == null ? "-" : loan.getInterestRate().toPlainString() + "%"),
                new Detail("Status", status),
                new Detail("Reviewed by", reviewedBy)));
    }

    private String detailCard(List<Detail> details) {
        StringBuilder rows = new StringBuilder();
        for (Detail detail : details) {
            rows.append("<tr><td style=\"padding:10px 0;color:#6b7771;font-size:13px;\">")
                    .append(escapeHtml(detail.label()))
                    .append("</td><td style=\"padding:10px 0;text-align:right;color:").append(TEXT)
                    .append(";font-size:13px;font-weight:700;\">")
                    .append(escapeHtml(detail.value()))
                    .append("</td></tr>");
        }
        return "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" "
                + "style=\"margin:24px 0;border-collapse:collapse;border-top:1px solid #e7eee9;border-bottom:1px solid #e7eee9;\">"
                + rows + "</table>";
    }

    private void sendEmail(String to, String subject, EmailContent content, String context) {
        if (!mailEnabled) {
            log.info("Mail disabled for {} notification to {} with subject '{}'", context, to, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plainText(content), buildHtml(content));
            mailSender.send(message);
            log.info("Sent {} notification to {}", context, to);
        } catch (MailException | MessagingException ex) {
            log.warn("Failed to send {} notification to {}: {}", context, to, ex.getMessage());
        }
    }

    private String buildHtml(EmailContent content) {
        String action = content.actionUrl() == null ? "" : "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:26px 0 6px;\"><tr><td "
                + "style=\"border-radius:999px;background:" + GREEN + ";\"><a href=\"" + escapeAttribute(content.actionUrl()) + "\" "
                + "style=\"display:inline-block;padding:13px 24px;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;\">"
                + escapeHtml(content.actionLabel()) + "</a></td></tr></table>";
        String hero = content.heroAsset() == null ? "" : "<img src=\"" + assetUrl(content.heroAsset()) + "\" alt=\"\" width=\"560\" "
                + "style=\"display:block;width:100%;max-width:560px;height:180px;object-fit:cover;border:0;\">";

        return "<!doctype html><html><body style=\"margin:0;padding:0;background:#edf5ef;\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#edf5ef;\"><tr><td align=\"center\" style=\"padding:28px 12px;\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;\">"
                + "<tr><td style=\"padding:28px 34px;background:" + DEEP_GREEN + ";background-image:url('" + assetUrl("1_header-bg-sm.jpg") + "');background-size:cover;\">"
                + "<p style=\"margin:0;color:#bfe7dd;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;\">" + escapeHtml(content.eyebrow()) + "</p>"
                + "<p style=\"margin:8px 0 0;color:#ffffff;font-family:Arial,sans-serif;font-size:30px;font-weight:700;line-height:1.15;\">lawra</p></td></tr>"
                + "<tr><td>" + hero + "</td></tr>"
                + "<tr><td style=\"padding:32px 34px 22px;\"><h1 style=\"margin:0 0 14px;color:" + TEXT + ";font-family:Arial,sans-serif;font-size:25px;line-height:1.25;\">"
                + escapeHtml(content.title()) + "</h1><p style=\"margin:0;color:#56645d;font-family:Arial,sans-serif;font-size:15px;line-height:1.65;\">"
                + escapeHtml(content.intro()) + "</p>" + content.detailsHtml() + action
                + "<p style=\"margin:24px 0 0;color:#6b7771;font-family:Arial,sans-serif;font-size:12px;line-height:1.55;\">" + escapeHtml(content.footerNote()) + "</p></td></tr>"
                + "<tr><td style=\"padding:20px 34px;background:#f4f8f5;text-align:center;\"><p style=\"margin:0 0 12px;color:#6b7771;font-family:Arial,sans-serif;font-size:11px;\">Manage your money with clarity and confidence.</p>"
                + socialLinks() + "<p style=\"margin:14px 0 0;color:#8a9690;font-family:Arial,sans-serif;font-size:10px;\">© Lawra. This is an automated notification.</p></td></tr>"
                + "</table></td></tr></table></body></html>";
    }

    private String socialLinks() {
        return "<a href=\"#\" style=\"margin:0 5px;\"><img src=\"" + assetUrl("9_facebook2x.png") + "\" width=\"20\" alt=\"Facebook\" style=\"border:0;\"></a>"
                + "<a href=\"#\" style=\"margin:0 5px;\"><img src=\"" + assetUrl("10_twitter2x.png") + "\" width=\"20\" alt=\"X\" style=\"border:0;\"></a>"
                + "<a href=\"#\" style=\"margin:0 5px;\"><img src=\"" + assetUrl("11_linkedin2x.png") + "\" width=\"20\" alt=\"LinkedIn\" style=\"border:0;\"></a>"
                + "<a href=\"#\" style=\"margin:0 5px;\"><img src=\"" + assetUrl("12_instagram2x.png") + "\" width=\"20\" alt=\"Instagram\" style=\"border:0;\"></a>";
    }

    private String plainText(EmailContent content) {
        return content.eyebrow() + "\n\n" + content.title() + "\n\n" + content.intro()
                + "\n\n" + content.detailsHtml().replace("</td><td", ": <td").replaceAll("<[^>]+>", "")
                + (content.actionUrl() == null ? "" : "\n\n" + content.actionLabel() + ": " + content.actionUrl())
                + "\n\n" + content.footerNote();
    }

    private String buildResetLink(String token) {
        return resetPasswordUrlBase + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    private String assetUrl(String assetName) {
        return publicBaseUrl.replaceAll("/+$", "") + "/email/" + assetName;
    }

    private String loanPackageName(Loan loan) {
        return loan.getLoanPackage() != null && loan.getLoanPackage().getName() != null
                ? loan.getLoanPackage().getName() : "Your loan package";
    }

    private String money(BigDecimal amount) {
        return "GHS " + (amount == null ? "0.00" : amount.setScale(2, RoundingMode.HALF_UP).toPlainString());
    }

    private String roleName(User user) {
        return switch (user.getRole()) {
            case BORROWER -> "Employee";
            case PAYMASTER -> "Paymaster";
            case ADMIN -> "Administrator";
        };
    }

    private String safeName(User user) {
        return user == null || user.getFullName() == null || user.getFullName().isBlank() ? "there" : user.getFullName();
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private String escapeAttribute(String value) {
        return escapeHtml(value).replace("'", "&#39;");
    }

    private record Detail(String label, String value) { }

    private record EmailContent(String eyebrow, String title, String intro, String detailsHtml,
                                String actionLabel, String actionUrl, String heroAsset, String footerNote) { }
}
