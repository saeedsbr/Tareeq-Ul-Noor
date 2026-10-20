package com.ilmpath.questions;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {
    List<CommentReaction> findByTargetTypeAndTargetIdIn(String targetType, Collection<Long> ids);
    Optional<CommentReaction> findByUserIdAndTargetTypeAndTargetId(String userId, String targetType, Long targetId);
}
