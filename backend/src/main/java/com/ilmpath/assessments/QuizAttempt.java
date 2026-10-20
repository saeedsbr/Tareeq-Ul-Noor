package com.ilmpath.assessments;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "quiz_attempts") @Getter @Setter
public class QuizAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "quiz_id") private Long quizId;
    @Column(name = "user_id") private String userId;
    private String status = "IN_PROGRESS"; // IN_PROGRESS, AWAITING_REVIEW, GRADED
    @Column(name = "started_at") private Instant startedAt = Instant.now();
    @Column(name = "submitted_at") private Instant submittedAt;
    @Column(name = "score_awarded") private Integer scoreAwarded;
    @Column(name = "score_possible") private Integer scorePossible;
    private BigDecimal percentage;
    private Boolean passed;
}
