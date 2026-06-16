package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class AuditLogDetailDTO {
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

    private String beforeStateJson;
    private String afterStateJson;
    private String metadataJson;
}

