package com.ilmpath.assessments;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUserIdAndQuizIdOrderByStartedAtDesc(String userId, Long quizId);
    List<QuizAttempt> findByUserIdOrderByStartedAtDesc(String userId);
    List<QuizAttempt> findByStatusOrderBySubmittedAtAsc(String status);
    boolean existsByQuizId(Long quizId);
    long countByUserIdAndStatusNot(String userId, String status);
    Optional<QuizAttempt> findFirstByUserIdAndQuizIdAndStatus(String userId, Long quizId, String status);
}
