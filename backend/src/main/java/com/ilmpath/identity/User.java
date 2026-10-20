package com.ilmpath.identity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Setter;

@Entity @Table(name = "users") @Getter @Setter
public class User {
    @Id @Column(length = 36) private String id = UUID.randomUUID().toString();
    private String name;
    private String email;
    @Column(name = "password_hash") private String passwordHash;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) private Role role = Role.LEARNER;
    /** Chosen once by the user and never changed afterwards; not updatable through JPA. NULL only until chosen (or for the administrator). */
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(updatable = false) private Gender gender;
    private String status = "ACTIVE";
    @Column(name = "created_at") private Instant createdAt = Instant.now();
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();
    @PreUpdate void touch() { updatedAt = Instant.now(); }
    public boolean isActive() { return "ACTIVE".equals(status); }
}
