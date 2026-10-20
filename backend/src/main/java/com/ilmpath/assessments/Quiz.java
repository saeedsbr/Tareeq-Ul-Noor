package com.ilmpath.assessments;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "quizzes") @Getter @Setter
public class Quiz {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "lesson_id") private Long lessonId;
    private String title;
    @Column(columnDefinition = "TEXT") private String instructions;
    @Column(name = "pass_percentage") private int passPercentage = 60;
    private String status = "DRAFT"; // DRAFT, PUBLISHED, ARCHIVED
    private int version = 1;
    @Column(name = "created_at") private Instant createdAt = Instant.now();
}
