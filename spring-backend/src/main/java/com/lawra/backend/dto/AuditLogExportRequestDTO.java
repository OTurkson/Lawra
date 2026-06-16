package com.lawra.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AuditLogExportRequestDTO {
    private LocalDateTime from;
    private LocalDateTime to;

    private String actorEmail;
    private String action;
    private String resourceType;
    private String resourceId;

    /**
     * Maximum number of rows to include in the export.
     */
    private Integer maxRows;
}

