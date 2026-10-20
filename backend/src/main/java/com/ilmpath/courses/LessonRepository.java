package com.ilmpath.courses;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByCourseIdAndStatusOrderByPositionAscIdAsc(Long courseId, String status);
    List<Lesson> findByCourseIdOrderByPositionAscIdAsc(Long courseId);
    List<Lesson> findByCourseIdInAndStatus(Collection<Long> courseIds, String status);
    boolean existsByCourseIdAndSlug(Long courseId, String slug);
    @Query("select count(l) from Lesson l where l.courseId = :cid and l.status = 'PUBLISHED'")
    long countPublished(@Param("cid") Long courseId);
}
