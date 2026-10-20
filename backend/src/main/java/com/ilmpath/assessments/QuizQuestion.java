package com.ilmpath.assessments;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "quiz_questions") @Getter @Setter
public class QuizQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "quiz_id") private Long quizId;
    private String type; // MCQ, SHORT_ANSWER, ESSAY
    @Column(columnDefinition = "TEXT") private String prompt;
    private int points = 1;
    private int position;
    @Column(name = "model_answer", columnDefinition = "TEXT") private String modelAnswer;
    @Column(name = "grading_mode") private String gradingMode = "AUTO"; // AUTO | MANUAL
}
