package com.ilmpath.questions;

import com.ilmpath.identity.Gender;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByUserIdAndStatusNotOrderByCreatedAtDesc(String userId, String status);
    List<Question> findByStatusOrderByCreatedAtDesc(String status);
    long countByStatus(String status);

    // Gender-scoped reads. The gender filter is part of the query itself, so rows of the other group never leave the database.
    String SAME_GROUP = "q.status <> 'HIDDEN' and q.userId in (select u.id from User u where u.gender = :g)";

    @Query("select q from Question q where " + SAME_GROUP + " order by q.createdAt desc")
    List<Question> findForGender(@Param("g") Gender g);

    @Query("select q from Question q where " + SAME_GROUP + " and q.lessonId = :lid order by q.createdAt desc")
    List<Question> findForGenderAndLesson(@Param("g") Gender g, @Param("lid") Long lessonId);

    @Query("select q from Question q where " + SAME_GROUP + " and lower(q.body) like lower(concat('%', :s, '%')) order by q.createdAt desc")
    List<Question> searchForGender(@Param("g") Gender g, @Param("s") String search);

    @Query("select q from Question q where q.id = :id and " + SAME_GROUP)
    Optional<Question> findVisibleTo(@Param("id") Long id, @Param("g") Gender g);

    @Query("select q from Question q where q.status <> 'HIDDEN' and q.lessonId = :lid order by q.createdAt desc")
    List<Question> findAllForLesson(@Param("lid") Long lessonId);
}
