package com.ilmpath.admin;

import com.ilmpath.common.ApiException;
import com.ilmpath.common.Slugs;
import com.ilmpath.common.VideoUrls;
import com.ilmpath.courses.*;
import com.ilmpath.identity.CurrentUser;
import com.ilmpath.resources.Note;
import com.ilmpath.resources.NoteRepository;
import com.ilmpath.resources.NotesController;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminContentController {
    private static final String STATUS_RX = "DRAFT|PUBLISHED|ARCHIVED";

    public record CourseReq(@NotBlank @Size(max = 200) String title, @Size(max = 5000) String description, @Size(max = 40) String level,
                            @Size(max = 500) String coverImageUrl, @Pattern(regexp = STATUS_RX) String status, Integer position) {}
    public record ResourceReq(@NotBlank @Size(max = 200) String title, @Pattern(regexp = "LINK|PDF|REFERENCE|FILE") String type, @NotBlank String contentOrUrl) {}
    public record LessonReq(Long courseId, @NotBlank @Size(max = 200) String title, @Size(max = 5000) String description, String videoUrl,
                            Integer durationMinutes, Integer position, @Pattern(regexp = STATUS_RX) String status, List<ResourceReq> resources) {}
    public record NoteReq(Long courseId, Long lessonId, @Pattern(regexp = "NOTE|BENEFIT") String kind, @NotBlank @Size(max = 200) String title,
                          @NotBlank @Size(max = 10000) String body, @Pattern(regexp = STATUS_RX) String status,
                          @Size(max = 255) String attachmentName, @Pattern(regexp = "^(/api/v1/files/[0-9a-f-]{36})?$", message = "Invalid attachment") String attachmentUrl) {}
    public record LessonAdmin(Long id, Long courseId, String courseTitle, String title, String description, String videoUrl, Integer durationMinutes,
                              int position, String status, List<LessonController.ResourceDto> resources) {}
    public record CourseAdmin(Long id, String title, String slug, String description, String level, String coverImageUrl, String status, int position, long lessonCount) {}

    private final CourseRepository courses;
    private final LessonRepository lessons;
    private final LessonResourceRepository resources;
    private final NoteRepository notes;
    private final NotesController notesController;

    public AdminContentController(CourseRepository courses, LessonRepository lessons, LessonResourceRepository resources, NoteRepository notes, NotesController nc) {
        this.courses = courses; this.lessons = lessons; this.resources = resources; this.notes = notes; this.notesController = nc;
    }

    // ---- courses ----
    private CourseAdmin dto(Course c) {
        return new CourseAdmin(c.getId(), c.getTitle(), c.getSlug(), c.getDescription(), c.getLevel(), c.getCoverImageUrl(), c.getStatus(), c.getPosition(),
            lessons.findByCourseIdOrderByPositionAscIdAsc(c.getId()).size());
    }

    @GetMapping("/courses")
    public List<CourseAdmin> courses() { return courses.findAll().stream().sorted(Comparator.comparingInt(Course::getPosition).thenComparing(Course::getId)).map(this::dto).toList(); }

    @PostMapping("/courses") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public CourseAdmin createCourse(@Valid @RequestBody CourseReq r) {
        Course c = new Course();
        String base = Slugs.of(r.title()), slug = base; int i = 2;
        while (courses.existsBySlug(slug)) slug = base + "-" + i++;
        c.setSlug(slug); c.setCreatedBy(CurrentUser.get().getId());
        apply(c, r);
        return dto(courses.save(c));
    }

    @PutMapping("/courses/{id}") @Transactional
    public CourseAdmin updateCourse(@PathVariable Long id, @Valid @RequestBody CourseReq r) {
        Course c = courses.findById(id).orElseThrow(() -> ApiException.notFound("Course not found"));
        apply(c, r);
        return dto(courses.save(c));
    }

    private void apply(Course c, CourseReq r) {
        c.setTitle(r.title().trim()); c.setDescription(r.description());
        if (r.level() != null) c.setLevel(r.level());
        c.setCoverImageUrl(r.coverImageUrl() == null || r.coverImageUrl().isBlank() ? null : r.coverImageUrl().trim());
        if (r.status() != null) c.setStatus(r.status());
        if (r.position() != null) c.setPosition(r.position());
    }

    @DeleteMapping("/courses/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void archiveCourse(@PathVariable Long id) {
        // Archive, never hard-delete: learner progress and quiz history must survive.
        courses.findById(id).orElseThrow(() -> ApiException.notFound("Course not found")).setStatus("ARCHIVED");
    }

    // ---- lessons ----
    private LessonAdmin dto(Lesson l, Map<Long, String> courseTitles) {
        return new LessonAdmin(l.getId(), l.getCourseId(), courseTitles.get(l.getCourseId()), l.getTitle(), l.getDescription(), l.getVideoUrl(),
            l.getDurationMinutes(), l.getPosition(), l.getStatus(),
            resources.findByLessonIdOrderByPositionAscIdAsc(l.getId()).stream().map(x -> new LessonController.ResourceDto(x.getId(), x.getTitle(), x.getResourceType(), x.getContentOrUrl())).toList());
    }

    private Map<Long, String> titles() {
        Map<Long, String> m = new HashMap<>(); courses.findAll().forEach(c -> m.put(c.getId(), c.getTitle())); return m;
    }

    @GetMapping("/lessons")
    public List<LessonAdmin> allLessons(@RequestParam(required = false) Long courseId) {
        var t = titles();
        return lessons.findAll().stream().filter(l -> courseId == null || l.getCourseId().equals(courseId))
            .sorted(Comparator.comparing(Lesson::getCourseId).thenComparingInt(Lesson::getPosition).thenComparing(Lesson::getId)).map(l -> dto(l, t)).toList();
    }

    @GetMapping("/lessons/{id}")
    public LessonAdmin oneLesson(@PathVariable Long id) {
        return dto(lessons.findById(id).orElseThrow(() -> ApiException.notFound("Lesson not found")), titles());
    }

    @PostMapping("/lessons") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public LessonAdmin createLesson(@Valid @RequestBody LessonReq r) {
        if (r.courseId() == null) throw ApiException.bad("courseId is required");
        courses.findById(r.courseId()).orElseThrow(() -> ApiException.notFound("Course not found"));
        Lesson l = new Lesson(); l.setCourseId(r.courseId());
        String base = Slugs.of(r.title()), slug = base; int i = 2;
        while (lessons.existsByCourseIdAndSlug(r.courseId(), slug)) slug = base + "-" + i++;
        l.setSlug(slug);
        l.setPosition(r.position() != null ? r.position() : lessons.findByCourseIdOrderByPositionAscIdAsc(r.courseId()).size() + 1);
        applyLesson(l, r);
        return dto(l, titles());
    }

    @PutMapping("/lessons/{id}") @Transactional
    public LessonAdmin updateLesson(@PathVariable Long id, @Valid @RequestBody LessonReq r) {
        Lesson l = lessons.findById(id).orElseThrow(() -> ApiException.notFound("Lesson not found"));
        if (r.position() != null) l.setPosition(r.position());
        applyLesson(l, r);
        return dto(l, titles());
    }

    private void applyLesson(Lesson l, LessonReq r) {
        l.setTitle(r.title().trim()); l.setDescription(r.description());
        l.setVideoUrl(VideoUrls.normalizeYoutube(r.videoUrl())); l.setVideoProvider("YOUTUBE");
        l.setDurationMinutes(r.durationMinutes());
        String status = r.status() == null ? l.getStatus() : r.status();
        if ("PUBLISHED".equals(status) && l.getVideoUrl() == null) throw ApiException.bad("Add a YouTube video URL before publishing the lesson");
        if ("PUBLISHED".equals(status) && l.getPublishedAt() == null) l.setPublishedAt(Instant.now());
        l.setStatus(status);
        lessons.save(l);
        if (r.resources() != null) {
            resources.deleteByLessonId(l.getId());
            resources.flush();
            int p = 1;
            for (ResourceReq x : r.resources()) {
                LessonResource lr = new LessonResource(); lr.setLessonId(l.getId()); lr.setTitle(x.title());
                lr.setResourceType(x.type() == null ? "LINK" : x.type()); lr.setContentOrUrl(x.contentOrUrl()); lr.setPosition(p++);
                resources.save(lr);
            }
        }
    }

    @PutMapping("/courses/{courseId}/lessons/order") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void reorder(@PathVariable Long courseId, @RequestBody List<Long> orderedIds) {
        int p = 1;
        for (Long id : orderedIds) {
            Lesson l = lessons.findById(id).filter(x -> x.getCourseId().equals(courseId)).orElseThrow(() -> ApiException.bad("Lesson " + id + " is not in this course"));
            l.setPosition(p++);
        }
    }

    @DeleteMapping("/lessons/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void archiveLesson(@PathVariable Long id) {
        lessons.findById(id).orElseThrow(() -> ApiException.notFound("Lesson not found")).setStatus("ARCHIVED");
    }

    // ---- notes & benefits ----
    @GetMapping("/notes")
    public List<Map<String, Object>> allNotes() {
        var items = notesController.map(notes.findAllByOrderByUpdatedAtDesc());
        var byId = new HashMap<Long, Note>(); notes.findAll().forEach(n -> byId.put(n.getId(), n));
        return items.stream().map(i -> {
            Note n = byId.get(i.id());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", i.id()); m.put("kind", i.kind()); m.put("title", i.title()); m.put("body", i.body());
            m.put("lessonId", n.getLessonId()); m.put("courseId", n.getCourseId()); m.put("lessonTitle", i.lessonTitle());
            m.put("courseTitle", i.courseTitle()); m.put("attachmentName", n.getAttachmentName()); m.put("attachmentUrl", n.getAttachmentUrl()); m.put("status", n.getStatus()); m.put("updatedAt", i.updatedAt());
            return m;
        }).toList();
    }

    @PostMapping("/notes") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String, Long> createNote(@Valid @RequestBody NoteReq r) {
        Note n = new Note(); n.setCreatedBy(CurrentUser.get().getId());
        applyNote(n, r);
        return Map.of("id", notes.save(n).getId());
    }

    @PutMapping("/notes/{id}") @Transactional
    public Map<String, Long> updateNote(@PathVariable Long id, @Valid @RequestBody NoteReq r) {
        Note n = notes.findById(id).orElseThrow(() -> ApiException.notFound("Note not found"));
        applyNote(n, r);
        return Map.of("id", notes.save(n).getId());
    }

    private void applyNote(Note n, NoteReq r) {
        if (r.lessonId() == null && r.courseId() == null) throw ApiException.bad("Link the note to a course or a lesson");
        n.setLessonId(r.lessonId()); n.setCourseId(r.courseId());
        if (r.lessonId() != null) lessons.findById(r.lessonId()).ifPresent(l -> n.setCourseId(l.getCourseId()));
        n.setKind(r.kind() == null ? "NOTE" : r.kind()); n.setTitle(r.title().trim()); n.setBody(r.body());
        n.setStatus(r.status() == null ? "DRAFT" : r.status());
        boolean has = r.attachmentUrl() != null && !r.attachmentUrl().isBlank();
        n.setAttachmentUrl(has ? r.attachmentUrl() : null); n.setAttachmentName(has ? r.attachmentName() : null);
    }

    @DeleteMapping("/notes/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void archiveNote(@PathVariable Long id) {
        notes.findById(id).orElseThrow(() -> ApiException.notFound("Note not found")).setStatus("ARCHIVED");
    }
}
