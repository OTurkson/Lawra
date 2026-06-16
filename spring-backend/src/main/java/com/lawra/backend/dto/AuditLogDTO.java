package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class AuditLogDTO {
    private Long id;
    private LocalDateTime timestamp;

    private UUID actorId;
    private String actorEmail;
    private String actorRole;

    private String action;
    private String resourceType;
    private String resourceId;

    private String httpMethod;
    private String path;
    private Integer statusCode;
    private String ipAddress;
    private String userAgent;

    /**
     * Preview strings to keep list payloads small.
     */
    private String beforeStatePreview;
    private String afterStatePreview;
}

