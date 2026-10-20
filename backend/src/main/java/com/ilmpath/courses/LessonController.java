package com.ilmpath.courses;

import com.ilmpath.assessments.Quiz;
import com.ilmpath.assessments.QuizRepository;
import com.ilmpath.common.ApiException;
import com.ilmpath.common.VideoUrls;
import com.ilmpath.identity.CurrentUser;
import com.ilmpath.progress.LessonCompletion;
import com.ilmpath.progress.LessonCompletionRepository;
import com.ilmpath.resources.Note;
import com.ilmpath.resources.NoteRepository;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class LessonController {
    public record NoteDto(Long id, String kind, String title, String body, String attachmentName, String attachmentUrl) {}
    public record ResourceDto(Long id, String title, String type, String contentOrUrl) {}
    public record CourseRef(Long id, String title, String slug) {}
    public record LessonDetail(Long id, String title, String description, String embedUrl, Integer durationMinutes, boolean completed,
                               CourseRef course, List<CatalogController.LessonSummary> lessons, Long prevId, Long nextId,
                               List<NoteDto> notes, List<NoteDto> benefits, List<ResourceDto> resources,
                               Long quizId, String quizTitle, int completedCount, int totalCount) {}

    private final LessonRepository lessons;
    private final CourseRepository courses;
    private final LessonResourceRepository resources;
    private final NoteRepository notes;
    private final QuizRepository quizzes;
    private final LessonCompletionRepository completions;

    public LessonController(LessonRepository lessons, CourseRepository courses, LessonResourceRepository resources, NoteRepository notes,
                            QuizRepository quizzes, LessonCompletionRepository completions) {
        this.lessons = lessons; this.courses = courses; this.resources = resources; this.notes = notes; this.quizzes = quizzes; this.completions = completions;
    }

    private Lesson published(Long id) {
        Lesson l = lessons.findById(id).filter(x -> "PUBLISHED".equals(x.getStatus())).orElseThrow(() -> ApiException.notFound("Lesson not found"));
        courses.findById(l.getCourseId()).filter(c -> "PUBLISHED".equals(c.getStatus())).orElseThrow(() -> ApiException.notFound("Lesson not found"));
        return l;
    }

    @GetMapping("/lessons/{id}")
    public LessonDetail get(@PathVariable Long id) {
        String uid = CurrentUser.get().getId();
        Lesson l = published(id);
        Course c = courses.findById(l.getCourseId()).orElseThrow();
        List<Lesson> all = lessons.findByCourseIdAndStatusOrderByPositionAscIdAsc(c.getId(), "PUBLISHED");
        Set<Long> done = new HashSet<>(completions.completedAmong(uid, all.stream().map(Lesson::getId).toList()));
        int idx = 0;
        for (int i = 0; i < all.size(); i++) if (all.get(i).getId().equals(id)) idx = i;
        List<Note> ns = notes.findByLessonIdAndStatusOrderByIdAsc(id, "PUBLISHED");
        Quiz q = quizzes.findFirstByLessonIdAndStatusOrderByVersionDesc(id, "PUBLISHED").orElse(null);
        return new LessonDetail(l.getId(), l.getTitle(), l.getDescription(), l.getVideoUrl(), l.getDurationMinutes(), done.contains(id),
            new CourseRef(c.getId(), c.getTitle(), c.getSlug()),
            all.stream().map(x -> new CatalogController.LessonSummary(x.getId(), x.getTitle(), x.getDescription(), x.getPosition(), x.getDurationMinutes(), done.contains(x.getId()))).toList(),
            idx > 0 ? all.get(idx - 1).getId() : null, idx < all.size() - 1 ? all.get(idx + 1).getId() : null,
            ns.stream().filter(n -> "NOTE".equals(n.getKind())).map(n -> new NoteDto(n.getId(), n.getKind(), n.getTitle(), n.getBody(), n.getAttachmentName(), n.getAttachmentUrl())).toList(),
            ns.stream().filter(n -> "BENEFIT".equals(n.getKind())).map(n -> new NoteDto(n.getId(), n.getKind(), n.getTitle(), n.getBody(), n.getAttachmentName(), n.getAttachmentUrl())).toList(),
            resources.findByLessonIdOrderByPositionAscIdAsc(id).stream().map(r -> new ResourceDto(r.getId(), r.getTitle(), r.getResourceType(), r.getContentOrUrl())).toList(),
            q == null ? null : q.getId(), q == null ? null : q.getTitle(), done.size(), all.size());
    }

    @PutMapping("/lessons/{id}/completion") @Transactional
    public Map<String, Boolean> complete(@PathVariable Long id) {
        String uid = CurrentUser.get().getId();
        published(id);
        if (!completions.existsByUserIdAndLessonId(uid, id)) {
            LessonCompletion c = new LessonCompletion(); c.setUserId(uid); c.setLessonId(id);
            completions.save(c);
        }
        return Map.of("completed", true);
    }

    @DeleteMapping("/lessons/{id}/completion") @Transactional
    public Map<String, Boolean> uncomplete(@PathVariable Long id) {
        completions.deleteByUserIdAndLessonId(CurrentUser.get().getId(), id);
        return Map.of("completed", false);
    }
}
