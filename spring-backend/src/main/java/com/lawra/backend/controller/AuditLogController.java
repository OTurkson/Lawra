package com.lawra.backend.controller;

import com.lawra.backend.dto.AuditLogDTO;
import com.lawra.backend.dto.AuditLogExportRequestDTO;
import com.lawra.backend.dto.AuditLogSearchRequestDTO;
import com.lawra.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    private static LocalDateTime parseToUtcDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        return Instant.parse(value).atZone(ZoneOffset.UTC).toLocalDateTime();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER')")
    public ResponseEntity<Page<AuditLogDTO>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String actorEmail,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String resourceId
    ) {
        int boundedSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(page, boundedSize);

        AuditLogSearchRequestDTO request = new AuditLogSearchRequestDTO();
        request.setFrom(parseToUtcDateTime(from));
        request.setTo(parseToUtcDateTime(to));
        request.setActorEmail(actorEmail);
        request.setAction(action);
        request.setResourceType(resourceType);
        request.setResourceId(resourceId);

        return ResponseEntity.ok(auditLogService.search(request, pageable));
    }

    @GetMapping("/export/csv")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER')")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String actorEmail,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) Integer maxRows
    ) {
        AuditLogExportRequestDTO request = new AuditLogExportRequestDTO();
        request.setFrom(parseToUtcDateTime(from));
        request.setTo(parseToUtcDateTime(to));
        request.setActorEmail(actorEmail);
        request.setAction(action);
        request.setResourceType(resourceType);
        request.setResourceId(resourceId);
        request.setMaxRows(maxRows);

        byte[] csv = auditLogService.exportCsv(request);

        String filename = "audit-logs.csv";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        return ResponseEntity.ok().headers(headers).body(csv);
    }

    @GetMapping("/export/pdf")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYMASTER')")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String actorEmail,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) Integer maxRows
    ) {
        AuditLogExportRequestDTO request = new AuditLogExportRequestDTO();
        request.setFrom(parseToUtcDateTime(from));
        request.setTo(parseToUtcDateTime(to));
        request.setActorEmail(actorEmail);
        request.setAction(action);
        request.setResourceType(resourceType);
        request.setResourceId(resourceId);
        request.setMaxRows(maxRows);

        byte[] pdf = auditLogService.exportPdf(request);

        String filename = "audit-logs.pdf";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        return ResponseEntity.ok().headers(headers).body(pdf);
    }
}

