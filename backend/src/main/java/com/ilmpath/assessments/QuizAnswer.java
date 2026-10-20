package com.ilmpath.assessments;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "quiz_answers") @Getter @Setter
public class QuizAnswer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "attempt_id") private Long attemptId;
    @Column(name = "quiz_question_id") private Long quizQuestionId;
    @Column(name = "selected_option_id") private Long selectedOptionId;
    @Column(name = "text_answer", columnDefinition = "TEXT") private String textAnswer;
    @Column(name = "awarded_points") private Integer awardedPoints;
    @Column(columnDefinition = "TEXT") private String feedback;
}
