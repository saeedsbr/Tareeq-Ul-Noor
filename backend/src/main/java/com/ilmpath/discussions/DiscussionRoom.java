package com.ilmpath.discussions;

import com.ilmpath.identity.Gender;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity @Table(name = "discussion_rooms") @Getter @Setter
public class DiscussionRoom {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(updatable = false) private Gender gender;
    private String title;
    private String description;
    private String status = "ACTIVE"; // ACTIVE | ARCHIVED
    @Column(name = "created_at") private Instant createdAt = Instant.now();
}
