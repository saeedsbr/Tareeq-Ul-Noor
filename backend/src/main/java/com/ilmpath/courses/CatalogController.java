package com.ilmpath.courses;

import com.ilmpath.common.ApiException;
import com.ilmpath.identity.CurrentUser;
import com.ilmpath.identity.User;
import com.ilmpath.progress.LessonCompletionRepository;
import com.ilmpath.progress.ProgressService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {
    public record CourseCard(Long id, String title, String slug, String description, String level, String coverImageUrl,
                             int lessonCount, Integer completedCount, Integer progress) {}
    public record LessonSummary(Long id, String title, String description, int position, Integer durationMinutes, boolean completed) {}
    public record CourseDetail(CourseCard course, List<LessonSummary> lessons, Long continueLessonId) {}

    private final CourseRepository courses;
    private final LessonRepository lessons;
    private final ProgressService progress;
    private final LessonCompletionRepository completions;

    public CatalogController(CourseRepository courses, LessonRepository lessons, ProgressService progress, LessonCompletionRepository completions) {
        this.courses = courses; this.lessons = lessons; this.progress = progress; this.completions = completions;
    }

    public static CourseCard card(Course c, ProgressService.Counts n, boolean withUser) {
        return new CourseCard(c.getId(), c.getTitle(), c.getSlug(), c.getDescription(), c.getLevel(), c.getCoverImageUrl(),
            n.total(), withUser ? n.done() : null, withUser ? n.percent() : null);
    }

    @GetMapping("/courses")
    public List<CourseCard> list(@RequestParam(required = false) String q) {
        User u = CurrentUser.optional();
        List<Course> cs = q == null || q.isBlank() ? courses.findByStatusOrderByPositionAscIdAsc("PUBLISHED") : courses.search(q.trim());
        var counts = progress.countsFor(cs.stream().map(Course::getId).toList(), u == null ? null : u.getId());
        return cs.stream().map(c -> card(c, counts.get(c.getId()), u != null)).toList();
    }

    @GetMapping("/courses/{slug}")
    public CourseDetail detail(@PathVariable String slug) {
        User u = CurrentUser.optional();
        Course c = courses.findBySlugAndStatus(slug, "PUBLISHED").orElseThrow(() -> ApiException.notFound("Course not found"));
        List<Lesson> ls = lessons.findByCourseIdAndStatusOrderByPositionAscIdAsc(c.getId(), "PUBLISHED");
        Set<Long> done = u == null || ls.isEmpty() ? Set.of()
            : new HashSet<>(completions.completedAmong(u.getId(), ls.stream().map(Lesson::getId).toList()));
        var counts = progress.countsFor(List.of(c.getId()), u == null ? null : u.getId()).get(c.getId());
        Long next = ls.stream().filter(l -> !done.contains(l.getId())).map(Lesson::getId).findFirst()
            .orElse(ls.isEmpty() ? null : ls.get(0).getId());
        return new CourseDetail(card(c, counts, u != null),
            ls.stream().map(l -> new LessonSummary(l.getId(), l.getTitle(), l.getDescription(), l.getPosition(), l.getDurationMinutes(), done.contains(l.getId()))).toList(),
            next);
    }
}
