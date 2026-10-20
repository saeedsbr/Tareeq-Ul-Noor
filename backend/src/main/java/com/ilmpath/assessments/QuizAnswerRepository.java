package com.ilmpath.assessments;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {
    List<QuizAnswer> findByAttemptId(Long attemptId);
    Optional<QuizAnswer> findByAttemptIdAndQuizQuestionId(Long attemptId, Long quizQuestionId);
}
