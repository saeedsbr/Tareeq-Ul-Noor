package com.ilmpath.questions;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionReplyRepository extends JpaRepository<QuestionReply, Long> {
    List<QuestionReply> findByQuestionIdInOrderByCreatedAtAsc(Collection<Long> ids);
}
