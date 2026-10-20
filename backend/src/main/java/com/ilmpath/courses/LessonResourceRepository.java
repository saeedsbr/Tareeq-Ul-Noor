package com.ilmpath.courses;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonResourceRepository extends JpaRepository<LessonResource, Long> {
    List<LessonResource> findByLessonIdOrderByPositionAscIdAsc(Long lessonId);
    void deleteByLessonId(Long lessonId);
}
