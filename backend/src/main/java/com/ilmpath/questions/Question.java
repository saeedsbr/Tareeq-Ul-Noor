package com.ilmpath.questions;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "questions") @Getter @Setter
public class Question {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id") private String userId;
    @Column(name = "lesson_id") private Long lessonId;
    @Column(columnDefinition = "TEXT") private String body;
    private String status = "SUBMITTED"; // SUBMITTED, ANSWERED, RESOLVED, HIDDEN
    @Column(name = "created_at") private Instant createdAt = Instant.now();
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();
    @PreUpdate void touch() { updatedAt = Instant.now(); }
}
