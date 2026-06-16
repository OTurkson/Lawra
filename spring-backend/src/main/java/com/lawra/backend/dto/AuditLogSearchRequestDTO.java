package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AuditLogSearchRequestDTO {
    private LocalDateTime from;
    private LocalDateTime to;

    private String actorEmail;
    private String action;
    private String resourceType;
    private String resourceId;
}

