package com.ilmpath.audit;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "admin_audit_log") @Getter @Setter
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "admin_user_id") private String adminUserId;
    private String action;
    private String target;
    @Column(name = "http_status") private int httpStatus;
    @Column(name = "created_at") private Instant createdAt = Instant.now();
}
