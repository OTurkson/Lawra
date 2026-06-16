package com.lawra.backend.service;

import com.lawra.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AuditLogRetentionJob {

    private static final Logger log = LoggerFactory.getLogger(AuditLogRetentionJob.class);

    private final AuditLogRepository auditLogRepository;

    @Value("${app.audit.retention-days:365}")
    private int retentionDays;

    // Run once daily.
    @Scheduled(cron = "0 0 3 * * ?")
    public void purgeOldAuditLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        int before;
        try {
            before = (int) auditLogRepository.count();
        } catch (Exception ignored) {
            before = -1;
        }

        int deleted = 0;
        try {
            auditLogRepository.deleteByTimestampBefore(cutoff);
        } catch (Exception e) {
            log.warn("Audit log purge failed", e);
            return;
        }

        try {
            deleted = before >= 0 ? before - (int) auditLogRepository.count() : 0;
        } catch (Exception ignored) {
            deleted = 0;
        }

        log.info("Audit log retention purge completed. cutoff={}, deleted={} rows", cutoff, deleted);
    }
}

