package com.ilmpath.resources;

import com.ilmpath.courses.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class NotesController {
    public record NoteItem(Long id, String kind, String title, String body, Long lessonId, String lessonTitle, String courseTitle, java.time.Instant updatedAt) {}

    private final NoteRepository notes;
    private final LessonRepository lessons;
    private final CourseRepository courses;

    public NotesController(NoteRepository notes, LessonRepository lessons, CourseRepository courses) {
        this.notes = notes; this.lessons = lessons; this.courses = courses;
    }

    public List<NoteItem> map(List<Note> ns) {
        Map<Long, Lesson> ls = lessons.findAllById(ns.stream().map(Note::getLessonId).filter(Objects::nonNull).collect(Collectors.toSet()))
            .stream().collect(Collectors.toMap(Lesson::getId, l -> l));
        Set<Long> cids = ls.values().stream().map(Lesson::getCourseId).collect(Collectors.toSet());
        ns.stream().map(Note::getCourseId).filter(Objects::nonNull).forEach(cids::add);
        Map<Long, Course> cs = courses.findAllById(cids).stream().collect(Collectors.toMap(Course::getId, c -> c));
        return ns.stream().map(n -> {
            Lesson l = n.getLessonId() == null ? null : ls.get(n.getLessonId());
            Long cid = l != null ? l.getCourseId() : n.getCourseId();
            Course c = cid == null ? null : cs.get(cid);
            return new NoteItem(n.getId(), n.getKind(), n.getTitle(), n.getBody(), n.getLessonId(), l == null ? null : l.getTitle(), c == null ? null : c.getTitle(), n.getUpdatedAt());
        }).toList();
    }

    @GetMapping("/notes")
    public List<NoteItem> library() { return map(notes.findByStatusOrderByUpdatedAtDesc("PUBLISHED")); }
}
