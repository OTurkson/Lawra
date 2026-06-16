package com.lawra.backend.mapper;

import com.lawra.backend.dto.AuditLogDTO;
import com.lawra.backend.model.AuditLog;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class AuditLogMapper {

    public AuditLogDTO toDto(AuditLog log, int previewMaxChars) {
        AuditLogDTO dto = new AuditLogDTO();
        dto.setId(log.getId());
        dto.setTimestamp(log.getTimestamp());
        dto.setActorId(log.getActorId());
        dto.setActorEmail(log.getActorEmail());
        dto.setActorRole(log.getActorRole());
        dto.setAction(log.getAction());
        dto.setResourceType(log.getResourceType());
        dto.setResourceId(log.getResourceId());
        dto.setHttpMethod(log.getHttpMethod());
        dto.setPath(log.getPath());
        dto.setStatusCode(log.getStatusCode());
        dto.setIpAddress(log.getIpAddress());
        dto.setUserAgent(log.getUserAgent());
        dto.setBeforeStatePreview(truncate(log.getBeforeStateJson(), previewMaxChars));
        dto.setAfterStatePreview(truncate(log.getAfterStateJson(), previewMaxChars));
        return dto;
    }

    private String truncate(String value, int maxChars) {
        if (value == null) return null;
        if (maxChars <= 0) return null;
        if (value.length() <= maxChars) return value;
        return value.substring(0, maxChars) + "...";
    }
}

