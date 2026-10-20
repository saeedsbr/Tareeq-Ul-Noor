package com.ilmpath.progress;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "lesson_completions") @Getter @Setter
public class LessonCompletion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id") private String userId;
    @Column(name = "lesson_id") private Long lessonId;
    @Column(name = "completed_at") private Instant completedAt = Instant.now();
}
