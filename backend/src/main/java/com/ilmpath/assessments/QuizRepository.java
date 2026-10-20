package com.ilmpath.assessments;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    Optional<Quiz> findFirstByLessonIdAndStatusOrderByVersionDesc(Long lessonId, String status);
    List<Quiz> findByLessonIdOrderByVersionDesc(Long lessonId);
    List<Quiz> findByLessonIdInAndStatus(Collection<Long> ids, String status);
    List<Quiz> findByStatusNotOrderByIdDesc(String status);
}
