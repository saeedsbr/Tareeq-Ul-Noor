package com.ilmpath.assessments;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizOptionRepository extends JpaRepository<QuizOption, Long> {
    List<QuizOption> findByQuizQuestionIdInOrderByPositionAscIdAsc(Collection<Long> ids);
}
