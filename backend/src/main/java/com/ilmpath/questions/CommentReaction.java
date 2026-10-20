package com.ilmpath.questions;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity @Table(name = "comment_reactions") @Getter @Setter
public class CommentReaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id") private String userId;
    @Column(name = "target_type") private String targetType; // QUESTION | REPLY
    @Column(name = "target_id") private Long targetId;
    @JdbcTypeCode(SqlTypes.TINYINT) private int value; // 1 = like, -1 = dislike
    @Column(name = "created_at") private Instant createdAt = Instant.now();
}
