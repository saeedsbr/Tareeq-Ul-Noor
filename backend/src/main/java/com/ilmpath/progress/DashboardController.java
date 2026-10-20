package com.ilmpath.progress;

import com.ilmpath.assessments.QuizAttempt;
import com.ilmpath.assessments.QuizAttemptRepository;
import com.ilmpath.courses.*;
import com.ilmpath.identity.CurrentUser;
import com.ilmpath.questions.Question;
import com.ilmpath.questions.QuestionRepository;
import com.ilmpath.resources.NoteRepository;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class DashboardController {
    public record Activity(String type, String text, Instant at) {}
    public record Stats(int enrolledCourses, int completedLessons, int quizzesTaken, int questions) {}
    public record Continue(Long lessonId, String lessonTitle, CatalogController.CourseCard course) {}
    public record NoteBrief(Long id, String title, String kind, String body, Instant updatedAt) {}
    public record QuestionBrief(Long id, String body, String status, String lessonTitle, Instant createdAt) {}
    public record Dashboard(String name, Stats stats, int overallPercent, int overallDone, int overallTotal, Continue continueLearning,
                            List<CatalogController.CourseCard> courses, List<Activity> activity, List<NoteBrief> latestNotes, List<QuestionBrief> recentQuestions) {}

    private final CourseRepository courses;
    private final LessonRepository lessons;
    private final LessonCompletionRepository completions;
    private final ProgressService progress;
    private final QuizAttemptRepository attempts;
    private final QuestionRepository questions;
    private final NoteRepository notes;

    public DashboardController(CourseRepository courses, LessonRepository lessons, LessonCompletionRepository completions, ProgressService progress,
                               QuizAttemptRepository attempts, QuestionRepository questions, NoteRepository notes) {
        this.courses = courses; this.lessons = lessons; this.completions = completions; this.progress = progress;
        this.attempts = attempts; this.questions = questions; this.notes = notes;
    }

    private List<CatalogController.CourseCard> myCourses(String uid) {
        var published = courses.findByStatusOrderByPositionAscIdAsc("PUBLISHED");
        var counts = progress.countsFor(published.stream().map(Course::getId).toList(), uid);
        return published.stream().filter(c -> counts.get(c.getId()).done() > 0)
            .map(c -> CatalogController.card(c, counts.get(c.getId()), true)).toList();
    }

    @GetMapping("/me/courses")
    public List<CatalogController.CourseCard> myCourseList() { return myCourses(CurrentUser.get().getId()); }

    @GetMapping("/me/progress")
    public Dashboard dashboard() {
        var user = CurrentUser.get();
        String uid = user.getId();
        var mine = myCourses(uid);
        int total = mine.stream().mapToInt(CatalogController.CourseCard::lessonCount).sum();
        int done = mine.stream().mapToInt(CatalogController.CourseCard::completedCount).sum();

        // Continue: the course of the latest completion, else the first published course.
        CatalogController.CourseCard cc = null;
        var recent = completions.findTop8ByUserIdOrderByCompletedAtDesc(uid);
        Map<Long, Lesson> lessonById = new HashMap<>();
        if (!recent.isEmpty()) lessons.findAllById(recent.stream().map(LessonCompletion::getLessonId).toList()).forEach(l -> lessonById.put(l.getId(), l));
        for (var r : recent) {
            Lesson l = lessonById.get(r.getLessonId());
            if (l == null) continue;
            cc = mine.stream().filter(c -> c.id().equals(l.getCourseId()) && c.completedCount() < c.lessonCount()).findFirst().orElse(null);
            if (cc != null) break;
        }
        if (cc == null) cc = mine.stream().filter(c -> c.completedCount() < c.lessonCount()).findFirst().orElse(null);
        if (cc == null) {
            var pub = courses.findByStatusOrderByPositionAscIdAsc("PUBLISHED");
            if (!pub.isEmpty() && mine.isEmpty()) {
                var n = progress.countsFor(List.of(pub.get(0).getId()), uid).get(pub.get(0).getId());
                cc = CatalogController.card(pub.get(0), n, true);
            }
        }
        Continue cont = null;
        if (cc != null) {
            final Long cid = cc.id();
            var ls = lessons.findByCourseIdAndStatusOrderByPositionAscIdAsc(cid, "PUBLISHED");
            Set<Long> dn = ls.isEmpty() ? Set.of() : new HashSet<>(completions.completedAmong(uid, ls.stream().map(Lesson::getId).toList()));
            Lesson next = ls.stream().filter(l -> !dn.contains(l.getId())).findFirst().orElse(ls.isEmpty() ? null : ls.get(0));
            if (next != null) cont = new Continue(next.getId(), next.getTitle(), cc);
        }

        var myQs = questions.findByUserIdAndStatusNotOrderByCreatedAtDesc(uid, "HIDDEN");
        var myAttempts = attempts.findByUserIdOrderByStartedAtDesc(uid).stream().filter(a -> !"IN_PROGRESS".equals(a.getStatus())).toList();
        Set<Long> lessonIds = new HashSet<>(lessonById.keySet());
        myQs.stream().limit(3).forEach(q -> lessonIds.add(q.getLessonId()));
        lessons.findAllById(lessonIds).forEach(l -> lessonById.put(l.getId(), l));

        List<Activity> activity = new ArrayList<>();
        for (var r : recent) { var l = lessonById.get(r.getLessonId()); if (l != null) activity.add(new Activity("LESSON", "You completed the lesson " + l.getTitle(), r.getCompletedAt())); }
        for (QuizAttempt a : myAttempts.stream().limit(4).toList()) activity.add(new Activity("QUIZ", "You submitted a quiz", a.getSubmittedAt()));
        for (Question q : myQs.stream().limit(4).toList()) activity.add(new Activity("QUESTION", "You asked a question", q.getCreatedAt()));
        activity.sort(Comparator.comparing(Activity::at, Comparator.nullsLast(Comparator.reverseOrder())));

        return new Dashboard(user.getName(),
            new Stats(mine.size(), (int) completions.countByUserId(uid), myAttempts.size(), myQs.size()),
            total == 0 ? 0 : (int) Math.round(done * 100.0 / total), done, total, cont, mine,
            activity.stream().limit(6).toList(),
            notes.findTop5ByStatusOrderByUpdatedAtDesc("PUBLISHED").stream().map(n -> new NoteBrief(n.getId(), n.getTitle(), n.getKind(), n.getBody(), n.getUpdatedAt())).toList(),
            myQs.stream().limit(3).map(q -> new QuestionBrief(q.getId(), q.getBody(), q.getStatus(), lessonById.containsKey(q.getLessonId()) ? lessonById.get(q.getLessonId()).getTitle() : "", q.getCreatedAt())).toList());
    }
}
