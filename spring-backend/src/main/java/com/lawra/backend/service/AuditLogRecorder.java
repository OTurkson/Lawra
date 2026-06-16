package com.lawra.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawra.backend.model.*;
import com.lawra.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogRecorder {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final VirtualBankRepository virtualBankRepository;
    private final LoanPackageRepository loanPackageRepository;
    private final LoanRepository loanRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ObjectMapper objectMapper;

    public record ResolvedActor(UUID tenantId, UUID actorId, String actorEmail, String actorRole) {}

    public void record(
            UUID tenantId,
            UUID actorId,
            String actorEmail,
            String actorRole,
            String action,
            String resourceType,
            String resourceId,
            String httpMethod,
            String path,
            Integer statusCode,
            String ipAddress,
            String userAgent,
            String beforeStateJson,
            String afterStateJson,
            String metadataJson
    ) {
        if (tenantId == null) {
            // Can't store audit logs without tenant. Avoid breaking requests.
            return;
        }

        AuditLog log = new AuditLog();
        log.setTenantId(tenantId);
        log.setActorId(actorId);
        log.setActorEmail(actorEmail);
        log.setActorRole(actorRole);
        log.setAction(action);
        log.setResourceType(resourceType);
        log.setResourceId(resourceId);
        log.setHttpMethod(httpMethod);
        log.setPath(path);
        log.setStatusCode(statusCode);
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
        log.setBeforeStateJson(beforeStateJson);
        log.setAfterStateJson(afterStateJson);
        log.setMetadataJson(metadataJson);

        auditLogRepository.save(log);
    }

    public ResolvedActor resolveUserByEmailAndTenant(String email, UUID tenantId) {
        if (email == null || tenantId == null) return null;
        return userRepository.findByEmailAndTenantId(email, tenantId)
                .map(user -> new ResolvedActor(
                        tenantId,
                        user.getId(),
                        user.getEmail(),
                        user.getRole().name()
                ))
                .orElse(null);
    }

    public ResolvedActor resolveUserByActorId(UUID actorId) {
        if (actorId == null) return null;
        return userRepository.findById(actorId)
                .map(user -> new ResolvedActor(
                        user.getTenant() != null ? user.getTenant().getId() : null,
                        user.getId(),
                        user.getEmail(),
                        user.getRole().name()
                ))
                .orElse(null);
    }

    public ResolvedActor resolveUserByPasswordResetToken(String tokenValue) {
        if (tokenValue == null || tokenValue.isBlank()) return null;
        return passwordResetTokenRepository.findByToken(tokenValue)
                .map(token -> {
                    User user = token.getUser();
                    return new ResolvedActor(
                            user.getTenant().getId(),
                            user.getId(),
                            user.getEmail(),
                            user.getRole().name()
                    );
                })
                .orElse(null);
    }

    public String buildBeforeStateJson(String resourceType, String resourceId, UUID tenantId) {
        if (resourceType == null || resourceId == null) return null;

        return switch (resourceType) {
            case "USER" -> userSnapshot(resourceId, tenantId);
            case "TENANT" -> tenantSnapshot(resourceId);
            case "VIRTUAL_BANK" -> virtualBankSnapshot(resourceId, tenantId);
            case "LOAN_PACKAGE" -> loanPackageSnapshot(resourceId, tenantId);
            case "LOAN" -> loanSnapshot(resourceId, tenantId);
            default -> null;
        };
    }

    private String userSnapshot(String resourceId, UUID tenantId) {
        UUID uuid = parseUuid(resourceId);
        if (uuid == null) return null;
        Optional<User> userOpt = userRepository.findById(uuid);
        if (userOpt.isEmpty()) return null;
        User user = userOpt.get();
        if (tenantId != null && user.getTenant() != null && !tenantId.equals(user.getTenant().getId())) {
            return null;
        }
        return serializeSafeUser(user);
    }

    private String tenantSnapshot(String resourceId) {
        UUID tenantId = parseUuid(resourceId);
        if (tenantId == null) return null;
        return tenantRepository.findById(tenantId)
                .map(this::serializeSafeTenant)
                .orElse(null);
    }

    private String virtualBankSnapshot(String resourceId, UUID tenantId) {
        Long id = parseLong(resourceId);
        if (id == null) return null;

        VirtualBank bank = tenantId == null
                ? virtualBankRepository.findById(id).orElse(null)
                : virtualBankRepository.findByIdAndTenant_Id(id, tenantId).orElse(null);

        if (bank == null) return null;
        return serializeSafeVirtualBank(bank);
    }

    private String loanPackageSnapshot(String resourceId, UUID tenantId) {
        Long id = parseLong(resourceId);
        if (id == null) return null;

        LoanPackage lp = tenantId == null
                ? loanPackageRepository.findById(id).orElse(null)
                : loanPackageRepository.findByIdAndVirtualBank_Tenant_Id(id, tenantId).orElse(null);

        if (lp == null) return null;
        return serializeSafeLoanPackage(lp);
    }

    private String loanSnapshot(String resourceId, UUID tenantId) {
        Long id = parseLong(resourceId);
        if (id == null) return null;

        Loan loan = tenantId == null
                ? loanRepository.findById(id).orElse(null)
                : loanRepository.findByIdAndBorrower_Tenant_Id(id, tenantId).orElse(null);

        if (loan == null) return null;
        return serializeSafeLoan(loan);
    }

    private String serializeSafeUser(User user) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", user.getId() != null ? user.getId().toString() : null);
        m.put("email", user.getEmail());
        m.put("fullName", user.getFullName());
        m.put("phoneNumber", user.getPhoneNumber());
        m.put("balance", user.getBalance());
        m.put("role", user.getRole() != null ? user.getRole().name() : null);
        m.put("passwordResetRequired", user.getPasswordResetRequired());
        m.put("tenantId", user.getTenant() != null ? user.getTenant().getId().toString() : null);
        m.put("createdAt", user.getCreatedAt());
        m.put("updatedAt", user.getUpdatedAt());
        return toJson(m);
    }

    private String serializeSafeTenant(Tenant tenant) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", tenant.getId() != null ? tenant.getId().toString() : null);
        m.put("name", tenant.getName());
        m.put("createdAt", tenant.getCreatedAt());
        m.put("updatedAt", tenant.getUpdatedAt());
        return toJson(m);
    }

    private String serializeSafeVirtualBank(VirtualBank bank) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", bank.getId());
        m.put("name", bank.getName());
        m.put("balance", bank.getBalance());
        m.put("tenantId", bank.getTenant() != null ? bank.getTenant().getId().toString() : null);
        m.put("createdById", bank.getCreatedBy() != null ? bank.getCreatedBy().getId().toString() : null);
        m.put("createdAt", bank.getCreatedAt());
        m.put("updatedAt", bank.getUpdatedAt());
        return toJson(m);
    }

    private String serializeSafeLoanPackage(LoanPackage lp) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", lp.getId());
        m.put("name", lp.getName());
        m.put("balance", lp.getBalance());
        m.put("interestRate", lp.getInterestRate());
        m.put("virtualBankId", lp.getVirtualBank() != null ? lp.getVirtualBank().getId() : null);
        if (lp.getVirtualBank() != null && lp.getVirtualBank().getTenant() != null) {
            m.put("tenantId", lp.getVirtualBank().getTenant().getId().toString());
        }
        return toJson(m);
    }

    private String serializeSafeLoan(Loan loan) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", loan.getId());
        m.put("status", loan.getStatus() != null ? loan.getStatus().name() : null);
        m.put("principalAmount", loan.getPrincipalAmount());
        m.put("interestRate", loan.getInterestRate());
        m.put("period", loan.getPeriod() != null ? loan.getPeriod().name() : null);
        m.put("totalRepaymentAmount", loan.getTotalRepaymentAmount());
        m.put("dueDate", loan.getDueDate());
        m.put("borrowerId", loan.getBorrower() != null ? loan.getBorrower().getId().toString() : null);
        m.put("approvedById", loan.getApprovedBy() != null ? loan.getApprovedBy().getId().toString() : null);
        m.put("loanPackageId", loan.getLoanPackage() != null ? loan.getLoanPackage().getId() : null);
        if (loan.getBorrower() != null && loan.getBorrower().getTenant() != null) {
            m.put("tenantId", loan.getBorrower().getTenant().getId().toString());
        }
        return toJson(m);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private static UUID parseUuid(String value) {
        try {
            return UUID.fromString(value);
        } catch (Exception e) {
            return null;
        }
    }

    private static Long parseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (Exception e) {
            return null;
        }
    }
}

