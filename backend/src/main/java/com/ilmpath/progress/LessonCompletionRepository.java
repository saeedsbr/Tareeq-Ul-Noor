package com.ilmpath.progress;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LessonCompletionRepository extends JpaRepository<LessonCompletion, Long> {
    boolean existsByUserIdAndLessonId(String userId, Long lessonId);
    void deleteByUserIdAndLessonId(String userId, Long lessonId);
    List<LessonCompletion> findByUserId(String userId);
    List<LessonCompletion> findTop8ByUserIdOrderByCompletedAtDesc(String userId);
    @Query("select c.lessonId from LessonCompletion c where c.userId = :u and c.lessonId in :ids")
    List<Long> completedAmong(@Param("u") String userId, @Param("ids") Collection<Long> ids);
    long countByUserId(String userId);
}
