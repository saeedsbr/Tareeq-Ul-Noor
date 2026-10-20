package com.ilmpath.discussions;

import com.ilmpath.identity.Gender;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscussionRoomRepository extends JpaRepository<DiscussionRoom, Long> {
    List<DiscussionRoom> findByGenderAndStatusOrderByIdAsc(Gender gender, String status);
    Optional<DiscussionRoom> findByIdAndGenderAndStatus(Long id, Gender gender, String status);
    List<DiscussionRoom> findAllByOrderByGenderAscIdAsc();
}
