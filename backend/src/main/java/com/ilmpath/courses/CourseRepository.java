package com.ilmpath.courses;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findBySlugAndStatus(String slug, String status);
    boolean existsBySlug(String slug);
    List<Course> findByStatusOrderByPositionAscIdAsc(String status);

    @Query("select c from Course c where c.status = 'PUBLISHED' and (lower(c.title) like lower(concat('%', :q, '%')) or lower(c.description) like lower(concat('%', :q, '%'))) order by c.position, c.id")
    List<Course> search(@Param("q") String q);
}
