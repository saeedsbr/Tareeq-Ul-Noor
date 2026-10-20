package com.ilmpath.assessments;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "quiz_options") @Getter @Setter
public class QuizOption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "quiz_question_id") private Long quizQuestionId;
    private String text;
    @Column(name = "is_correct") private boolean correct;
    private int position;
}
