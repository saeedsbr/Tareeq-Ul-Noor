package com.ilmpath.resources;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByLessonIdAndStatusOrderByIdAsc(Long lessonId, String status);
    List<Note> findByStatusOrderByUpdatedAtDesc(String status);
    List<Note> findTop5ByStatusOrderByUpdatedAtDesc(String status);
    List<Note> findAllByOrderByUpdatedAtDesc();
}
