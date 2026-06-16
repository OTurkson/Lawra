package com.lawra.backend.repository;

import com.lawra.backend.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
        SELECT a FROM AuditLog a
        WHERE (:from IS NULL OR a.timestamp >= :from)
          AND (:to IS NULL OR a.timestamp <= :to)
          AND (:action IS NULL OR a.action = :action)
          AND (:resourceType IS NULL OR a.resourceType = :resourceType)
          AND (:resourceId IS NULL OR a.resourceId = :resourceId)
          AND (:actorEmail IS NULL OR LOWER(a.actorEmail) LIKE LOWER(CONCAT('%', :actorEmail, '%')))
        ORDER BY a.timestamp DESC
    """)
    Page<AuditLog> search(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("action") String action,
            @Param("resourceType") String resourceType,
            @Param("resourceId") String resourceId,
            @Param("actorEmail") String actorEmail,
            Pageable pageable
    );

    @Query("""
        SELECT a FROM AuditLog a
        WHERE (:from IS NULL OR a.timestamp >= :from)
          AND (:to IS NULL OR a.timestamp <= :to)
          AND (:action IS NULL OR a.action = :action)
          AND (:resourceType IS NULL OR a.resourceType = :resourceType)
          AND (:resourceId IS NULL OR a.resourceId = :resourceId)
          AND (:actorEmail IS NULL OR LOWER(a.actorEmail) LIKE LOWER(CONCAT('%', :actorEmail, '%')))
        ORDER BY a.timestamp DESC
    """)
    Page<AuditLog> searchExport(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("action") String action,
            @Param("resourceType") String resourceType,
            @Param("resourceId") String resourceId,
            @Param("actorEmail") String actorEmail,
            Pageable pageable
    );

    void deleteByTimestampBefore(LocalDateTime cutoff);
}

