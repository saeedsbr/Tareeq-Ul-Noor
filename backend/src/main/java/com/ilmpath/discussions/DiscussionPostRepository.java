package com.ilmpath.discussions;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DiscussionPostRepository extends JpaRepository<DiscussionPost, Long> {
    List<DiscussionPost> findByRoomIdAndStatusOrderByCreatedAtAsc(Long roomId, String status);

    @Query("select p from DiscussionPost p where p.roomId = :rid and p.status = 'VISIBLE' and lower(p.body) like lower(concat('%', :s, '%')) order by p.createdAt asc")
    List<DiscussionPost> search(@Param("rid") Long roomId, @Param("s") String search);

    List<DiscussionPost> findByRoomIdOrderByCreatedAtAsc(Long roomId);
    long countByRoomIdAndStatus(Long roomId, String status);
}
