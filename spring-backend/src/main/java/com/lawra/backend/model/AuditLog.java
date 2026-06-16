package com.lawra.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "audit_logs")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, columnDefinition = "CHAR(36)")
    private UUID tenantId;

    @Column(name = "actor_id", columnDefinition = "CHAR(36)")
    private UUID actorId;

    @Column(length = 150)
    private String actorEmail;

    @Column(length = 50)
    private String actorRole;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(nullable = false, length = 50)
    private String resourceType;

    @Column(length = 100)
    private String resourceId;

    @Column(nullable = false, length = 10)
    private String httpMethod;

    @Column(nullable = false, length = 255)
    private String path;

    @Column
    private Integer statusCode;

    @Column(length = 100)
    private String ipAddress;

    @Column(length = 255)
    private String userAgent;

    /**
     * JSON strings containing (redacted) snapshots of the resource state.
     * These are kept as strings so we can evolve the schema without migrations.
     */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String beforeStateJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String afterStateJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String metadataJson;

    // Reserved field for future search indexing; not currently used.
    @JsonIgnore
    @Column(length = 100)
    private String searchableKey;
}

