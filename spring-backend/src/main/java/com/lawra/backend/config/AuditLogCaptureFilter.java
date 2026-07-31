package com.lawra.backend.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawra.backend.security.CustomUserDetails;
import com.lawra.backend.security.CustomUserDetailsStub;
import com.lawra.backend.service.AuditLogRecorder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuditLogCaptureFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AuditLogCaptureFilter.class);

    private final AuditLogRecorder auditLogRecorder;
    private final ObjectMapper objectMapper;

    private boolean isAuditableWrite(HttpServletRequest request) {
        String method = request.getMethod();
        if (!("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method))) {
            return false;
        }

        String uri = request.getRequestURI();
        if (uri == null) return false;
        if (uri.startsWith("/audit-logs")) return false; // avoid recursion

        return uri.startsWith("/users")
                || uri.startsWith("/banks")
                || uri.startsWith("/loan-packages")
                || uri.startsWith("/loans")
                || uri.startsWith("/tenants")
                || uri.startsWith("/auth");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (!isAuditableWrite(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        String requestUri = request.getRequestURI();
        String httpMethod = request.getMethod();

        // Resolve actor/tenant from JWT claims if present.
        UUID actorId = null;
        UUID actorTenantId = null;
        String actorRole = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() != null) {
            Object principal = auth.getPrincipal();
            if (principal instanceof CustomUserDetailsStub stub) {
                actorId = stub.getUserId();
                actorTenantId = stub.getTenantId();
                if (auth.getAuthorities() != null && !auth.getAuthorities().isEmpty()) {
                    actorRole = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
                }
            } else if (principal instanceof CustomUserDetails userDetails) {
                actorId = userDetails.getUserId();
                actorTenantId = userDetails.getTenantId();
                actorRole = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
            }
        }

        // Parse request JSON only for unauth/auth endpoints.
        JsonNode requestJson = null;

        String resourceType = null;
        String action = null;
        String resourceId = null; // may be from path or resolved later from response for creates
        UUID auditTenantId = null; // final tenant scope for the audit row

        boolean beforeStateApplicable = false;
        UUID beforeTenantId = null;
        String beforeResourceId = null;

        boolean isAuthAction = false;

        // Route parsing based on actual URL segments (no off-by-one issues with leading "/").
        String[] raw = requestUri.split("/");
        java.util.List<String> segments = new java.util.ArrayList<>();
        for (String s : raw) {
            if (s != null && !s.isBlank()) segments.add(s);
        }

        if (!segments.isEmpty()) {
            String root = segments.get(0);
            int size = segments.size();

            // USER routes
            if ("users".equals(root)) {
                // POST /users
                if ("POST".equals(httpMethod) && size == 1) {
                    action = "USER_CREATE";
                    resourceType = "USER";
                    auditTenantId = actorTenantId; // may be null (public signup)
                }
                // PUT /users/{id} OR DELETE /users/{id}
                else if (("PUT".equals(httpMethod) || "DELETE".equals(httpMethod)) && size == 2) {
                    action = "PUT".equals(httpMethod) ? "USER_UPDATE" : "USER_DELETE";
                    resourceType = "USER";
                    resourceId = segments.get(1);
                    auditTenantId = actorTenantId;
                    beforeStateApplicable = true;
                    beforeTenantId = actorTenantId;
                    beforeResourceId = resourceId;
                }
                // POST /users/provision OR /users/invite
                else if ("POST".equals(httpMethod) && size == 2) {
                    String op = segments.get(1);
                    action = "provision".equals(op) ? "USER_PROVISION" : ("invite".equals(op) ? "USER_INVITE" : null);
                    resourceType = action != null ? "USER" : null;
                    auditTenantId = actorTenantId;
                }
                // POST /users/me/balance/top-up
                else if ("POST".equals(httpMethod) && size == 4
                        && "me".equals(segments.get(1))
                        && "balance".equals(segments.get(2))
                        && "top-up".equals(segments.get(3))) {
                    action = "USER_BALANCE_TOP_UP";
                    resourceType = "USER";
                    auditTenantId = actorTenantId;
                    beforeStateApplicable = true;
                    beforeTenantId = actorTenantId;
                    beforeResourceId = actorId != null ? actorId.toString() : null;
                }
            }

            // TENANT routes
            if ("tenants".equals(root)) {
                if ("POST".equals(httpMethod) && size == 1) {
                    action = "TENANT_CREATE";
                    resourceType = "TENANT";
                } else if (("PUT".equals(httpMethod) || "DELETE".equals(httpMethod)) && size == 2) {
                    action = "PUT".equals(httpMethod) ? "TENANT_UPDATE" : "TENANT_DELETE";
                    resourceType = "TENANT";
                    resourceId = segments.get(1);
                    auditTenantId = parseUuidSilently(resourceId);
                    beforeStateApplicable = true;
                    beforeTenantId = auditTenantId;
                    beforeResourceId = resourceId;
                }
            }

            // VIRTUAL BANK routes
            if ("banks".equals(root)) {
                if ("POST".equals(httpMethod) && size == 1) {
                    action = "VIRTUAL_BANK_CREATE";
                    resourceType = "VIRTUAL_BANK";
                    auditTenantId = actorTenantId;
                } else if (("PUT".equals(httpMethod) || "DELETE".equals(httpMethod)) && size == 2) {
                    action = "PUT".equals(httpMethod) ? "VIRTUAL_BANK_UPDATE" : "VIRTUAL_BANK_DELETE";
                    resourceType = "VIRTUAL_BANK";
                    resourceId = segments.get(1);
                    auditTenantId = actorTenantId;
                    beforeStateApplicable = true;
                    beforeTenantId = actorTenantId;
                    beforeResourceId = resourceId;
                } else if ("PATCH".equals(httpMethod) && size == 3 && "top-up".equals(segments.get(2))) {
                    action = "VIRTUAL_BANK_TOP_UP";
                    resourceType = "VIRTUAL_BANK";
                    resourceId = segments.get(1);
                    auditTenantId = actorTenantId;
                    beforeStateApplicable = true;
                    beforeTenantId = actorTenantId;
                    beforeResourceId = resourceId;
                }
            }

            // LOAN PACKAGE routes
            if ("loan-packages".equals(root)) {
                if ("POST".equals(httpMethod) && size == 1) {
                    action = "LOAN_PACKAGE_CREATE";
                    resourceType = "LOAN_PACKAGE";
                    auditTenantId = actorTenantId;
                } else if (("PUT".equals(httpMethod) || "DELETE".equals(httpMethod)) && size == 2) {
                    action = "PUT".equals(httpMethod) ? "LOAN_PACKAGE_UPDATE" : "LOAN_PACKAGE_DELETE";
                    resourceType = "LOAN_PACKAGE";
                    resourceId = segments.get(1);
                    auditTenantId = actorTenantId;
                    beforeStateApplicable = true;
                    beforeTenantId = actorTenantId;
                    beforeResourceId = resourceId;
                }
            }

            // LOAN routes
            if ("loans".equals(root)) {
                if ("POST".equals(httpMethod) && size == 1) {
                    action = "LOAN_CREATE";
                    resourceType = "LOAN";
                    auditTenantId = actorTenantId;
                } else if ("PUT".equals(httpMethod) && size == 2) {
                    action = "LOAN_STATUS_UPDATE";
                    resourceType = "LOAN";
                    resourceId = segments.get(1);
                    auditTenantId = actorTenantId;
                    beforeStateApplicable = true;
                    beforeTenantId = actorTenantId;
                    beforeResourceId = resourceId;
                } else if ("POST".equals(httpMethod) && size == 3
                        && "repayments".equals(segments.get(2))) {
                    action = "LOAN_REPAYMENT_CREATE";
                    resourceType = "LOAN";
                    resourceId = segments.get(1);
                    auditTenantId = actorTenantId;
                    beforeStateApplicable = true;
                    beforeTenantId = actorTenantId;
                    beforeResourceId = resourceId;
                }
            }

            // AUTH routes
            if ("auth".equals(root)) {
                isAuthAction = true;
                resourceType = "AUTH";
                if ("POST".equals(httpMethod) && size == 2) {
                    String op = segments.get(1);
                    if ("login".equals(op)) action = "AUTH_LOGIN";
                    else if ("request-password-reset".equals(op)) action = "PASSWORD_RESET_REQUEST";
                    else if ("reset-password".equals(op)) action = "PASSWORD_RESET_COMPLETE";
                }
            }
        }

        // If we failed to map the route, don't audit.
        if (action == null || resourceType == null) {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
            wrappedResponse.copyBodyToResponse();
            return;
        }

        // Before snapshot (only when we have a resource id & affected state exists).
        String beforeStateJson = null;
        if (beforeStateApplicable && beforeResourceId != null) {
            try {
                beforeStateJson = auditLogRecorder.buildBeforeStateJson(resourceType, beforeResourceId, beforeTenantId);
            } catch (Exception e) {
                log.warn("Failed to build audit before-state", e);
            }
        }

        int statusCode = 0;
        String afterStateJson = null;
        String metadataJson = null;

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            statusCode = wrappedResponse.getStatus();
        }

        // Ensure response body is sent to the client.
        wrappedResponse.copyBodyToResponse();

        // Extract response JSON for afterState (non-auth actions only).
        String responseBody = null;
        String contentType = wrappedResponse.getContentType();
        if (contentType != null && contentType.contains("application/json")) {
            responseBody = new String(wrappedResponse.getContentAsByteArray(), StandardCharsets.UTF_8);
        }

        // Extract request JSON after chain (for tenantId and actor email/role on public/auth endpoints).
        try {
            byte[] reqBytes = wrappedRequest.getContentAsByteArray();
            if (reqBytes != null && reqBytes.length > 0) {
                requestJson = objectMapper.readTree(new String(reqBytes, StandardCharsets.UTF_8));
            }
        } catch (Exception ignored) {
            requestJson = null;
        }

        UUID actorIdForAudit = actorId;
        String actorEmail = null;

        // Determine tenantId + actor identifiers for unauth/auth actions.
        if (isAuthAction) {
            if (requestJson != null) {
                String email = textOrNull(requestJson, "email");
                UUID tenantId = parseUuidSilently(textOrNull(requestJson, "tenantId"));

                // Password reset completion doesn't carry tenantId in request body.
                if ("PASSWORD_RESET_COMPLETE".equals(action)) {
                    String tokenValue = textOrNull(requestJson, "token");
                    var resolved = auditLogRecorder.resolveUserByPasswordResetToken(tokenValue);
                    if (resolved != null) {
                        auditTenantId = resolved.tenantId();
                        actorIdForAudit = resolved.actorId();
                        actorEmail = resolved.actorEmail();
                        actorRole = resolved.actorRole();
                    } else {
                        auditTenantId = null;
                    }
                } else {
                    // Login + reset-request provide tenantId
                    auditTenantId = tenantId;
                    actorEmail = email;
                    var resolved = auditLogRecorder.resolveUserByEmailAndTenant(email, tenantId);
                    if (resolved != null) {
                        actorIdForAudit = resolved.actorId();
                        actorRole = resolved.actorRole();
                    }
                }
            }

            metadataJson = buildAuthMetadataJson(statusCode, requestJson);
        } else if (resourceType != null && auditTenantId == null) {
            // Public signup: /users (permitAll)
            if ("USER_CREATE".equals(action) && requestJson != null) {
                UUID tenantId = parseUuidSilently(textOrNull(requestJson, "tenantId"));
                auditTenantId = tenantId;
                actorEmail = textOrNull(requestJson, "email");
                // Role field exists on signup; keep it as actorRole so admin can see who created the account.
                String role = textOrNull(requestJson, "role");
                if (role != null) actorRole = role;
            }
        }

        // For authenticated actions, fill actor email/role using actor id if we don't already have it.
        if (!isAuthAction && actorIdForAudit != null) {
            var resolved = auditLogRecorder.resolveUserByActorId(actorIdForAudit);
            if (resolved != null) {
                if (auditTenantId == null) {
                    auditTenantId = resolved.tenantId();
                }
                actorEmail = resolved.actorEmail();
                if (actorRole == null) actorRole = resolved.actorRole();
            }
        }

        // For tenant create: resolve affected tenantId/resourceId from response JSON.
        if ("TENANT_CREATE".equals(action) && requestJson == null) {
            // requestJson is irrelevant; parse response instead below.
        }
        if ("TENANT_CREATE".equals(action) && (auditTenantId == null || resourceId == null) && responseBody != null && contentType != null) {
            try {
                JsonNode respJson = objectMapper.readTree(responseBody);
                if (respJson != null) {
                    String createdId = textOrNull(respJson, "id");
                    if (createdId != null) {
                        auditTenantId = parseUuidSilently(createdId);
                        resourceId = createdId;
                    }
                }
            } catch (Exception ignored) {
                // no-op
            }
        }

        // After state: store response JSON for non-auth actions.
        if (!isAuthAction && responseBody != null && !responseBody.isBlank()) {
            // Extract resourceId for creates (if missing).
            if (resourceId == null) {
                try {
                    JsonNode respJson = objectMapper.readTree(responseBody);
                    if (respJson != null) {
                        JsonNode idNode = respJson.get("id");
                        if (idNode != null && !idNode.isNull()) {
                            resourceId = idNode.asText();
                        }
                    }
                } catch (Exception ignored) {
                    // no-op
                }
            }
            afterStateJson = responseBody;
        }

        // If we built a tenant-aware beforeState but auditTenantId is still null, skip persistence.
        try {
            auditLogRecorder.record(
                    auditTenantId,
                    actorIdForAudit,
                    actorEmail,
                    actorRole,
                    action,
                    resourceType,
                    resourceId,
                    httpMethod,
                    requestUri,
                    statusCode,
                    request.getRemoteAddr(),
                    request.getHeader("User-Agent"),
                    beforeStateJson,
                    afterStateJson,
                    metadataJson
            );
        } catch (Exception e) {
            log.warn("Audit log persistence failed", e);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode val = node.get(field);
        if (val == null || val.isNull()) return null;
        return val.asText();
    }

    private UUID parseUuidSilently(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return UUID.fromString(value);
        } catch (Exception e) {
            return null;
        }
    }

    private String buildAuthMetadataJson(int statusCode, JsonNode requestJson) {
        if (requestJson == null) return null;

        try {
            var m = new java.util.HashMap<String, Object>();
            m.put("outcome", statusCode >= 200 && statusCode < 300 ? "SUCCESS" : "FAILURE");
            m.put("statusCode", statusCode);
            // Avoid storing passwords and reset token values.
            m.put("email", textOrNull(requestJson, "email"));
            m.put("tenantId", textOrNull(requestJson, "tenantId"));
            m.put("ipAddress", null);
            return objectMapper.writeValueAsString(m);
        } catch (Exception e) {
            return null;
        }
    }
}

