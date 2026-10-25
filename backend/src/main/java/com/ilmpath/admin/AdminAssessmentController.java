package com.ilmpath.admin;

import com.ilmpath.assessments.*;
import com.ilmpath.common.ApiException;
import com.ilmpath.courses.LessonRepository;
import com.ilmpath.identity.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminAssessmentController {
    public record OptionReq(@NotBlank @Size(max = 500) String text, boolean correct) {}
    public record QuestionReq(@Pattern(regexp = "MCQ|SHORT_ANSWER|ESSAY") String type, @NotBlank String prompt, @Min(1) @Max(100) int points,
                              String modelAnswer, List<OptionReq> options) {}
    public record QuizReq(@NotNull Long lessonId, @NotBlank @Size(max = 200) String title, String instructions, @Min(0) @Max(100) int passPercentage,
                          @Pattern(regexp = "DRAFT|PUBLISHED|ARCHIVED") String status, @NotEmpty List<@Valid QuestionReq> questions) {}
    public record OptionAdmin(Long id, String text, boolean correct) {}
    public record QuestionAdmin(Long id, String type, String prompt, int points, String modelAnswer, List<OptionAdmin> options) {}
    public record QuizAdmin(Long id, Long lessonId, String lessonTitle, String title, String instructions, int passPercentage, String status, int version,
                            boolean hasAttempts, long attemptCount, List<QuestionAdmin> questions) {}
    public record GradeReq(@Min(0) int points, @Size(max = 2000) String feedback) {}
    public record AttemptRow(Long attemptId, String learnerName, String learnerEmail, String gender, Long quizId, String quizTitle, int quizVersion,
                             String lessonTitle, String status, Integer scoreAwarded, Integer scorePossible, java.math.BigDecimal percentage, Boolean passed, java.time.Instant submittedAt) {}
    public record PendingAttempt(Long attemptId, String learnerName, String quizTitle, java.time.Instant submittedAt) {}

    private final QuizRepository quizzes;
    private final QuizQuestionRepository questions;
    private final QuizOptionRepository options;
    private final QuizAttemptRepository attempts;
    private final LessonRepository lessons;
    private final UserRepository users;
    private final QuizAnswerRepository answers;
    private final AssessmentService service;
    private final QuizController quizController;

    public AdminAssessmentController(QuizRepository quizzes, QuizQuestionRepository questions, QuizOptionRepository options, QuizAttemptRepository attempts,
                                     LessonRepository lessons, UserRepository users, AssessmentService service, QuizController qc, QuizAnswerRepository answers) {
        this.answers = answers;
        this.quizzes = quizzes; this.questions = questions; this.options = options; this.attempts = attempts; this.lessons = lessons; this.users = users;
        this.service = service; this.quizController = qc;
    }

    private QuizAdmin dto(Quiz q) {
        var qs = questions.findByQuizIdOrderByPositionAscIdAsc(q.getId());
        var os = options.findByQuizQuestionIdInOrderByPositionAscIdAsc(qs.stream().map(QuizQuestion::getId).toList()).stream().collect(Collectors.groupingBy(QuizOption::getQuizQuestionId));
        var lesson = lessons.findById(q.getLessonId()).orElse(null);
        return new QuizAdmin(q.getId(), q.getLessonId(), lesson == null ? "" : lesson.getTitle(), q.getTitle(), q.getInstructions(), q.getPassPercentage(), q.getStatus(),
            q.getVersion(), attempts.existsByQuizId(q.getId()), attempts.countByQuizId(q.getId()),
            qs.stream().map(x -> new QuestionAdmin(x.getId(), x.getType(), x.getPrompt(), x.getPoints(), x.getModelAnswer(),
                os.getOrDefault(x.getId(), List.of()).stream().map(o -> new OptionAdmin(o.getId(), o.getText(), o.isCorrect())).toList())).toList());
    }

    @GetMapping("/quizzes")
    public List<QuizAdmin> list() { return quizzes.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id")).stream().map(this::dto).toList(); }

    @GetMapping("/quizzes/{id}")
    public QuizAdmin one(@PathVariable Long id) { return dto(quizzes.findById(id).orElseThrow(() -> ApiException.notFound("Quiz not found"))); }

    @PostMapping("/quizzes") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public QuizAdmin create(@Valid @RequestBody QuizReq r) {
        lessons.findById(r.lessonId()).orElseThrow(() -> ApiException.notFound("Lesson not found"));
        int version = quizzes.findByLessonIdOrderByVersionDesc(r.lessonId()).stream().findFirst().map(x -> x.getVersion() + 1).orElse(1);
        return dto(build(new Quiz(), r, version));
    }

    /** Editing a quiz that already has attempts creates a new immutable version; the old one is archived. */
    @PutMapping("/quizzes/{id}") @Transactional
    public QuizAdmin update(@PathVariable Long id, @Valid @RequestBody QuizReq r) {
        Quiz old = quizzes.findById(id).orElseThrow(() -> ApiException.notFound("Quiz not found"));
        if (attempts.existsByQuizId(id)) {
            old.setStatus("ARCHIVED");
            return dto(build(new Quiz(), r, old.getVersion() + 1));
        }
        questions.findByQuizIdOrderByPositionAscIdAsc(id).forEach(q -> questions.delete(q));
        questions.flush();
        return dto(build(old, r, old.getVersion()));
    }

    private Quiz build(Quiz q, QuizReq r, int version) {
        int total = r.questions().stream().mapToInt(QuestionReq::points).sum();
        if (total <= 0) throw ApiException.bad("A quiz needs at least one point available");
        q.setLessonId(r.lessonId()); q.setTitle(r.title().trim()); q.setInstructions(r.instructions()); q.setPassPercentage(r.passPercentage());
        q.setStatus(r.status() == null ? "DRAFT" : r.status()); q.setVersion(version);
        if ("PUBLISHED".equals(q.getStatus())) // one live quiz per lesson
            quizzes.findByLessonIdOrderByVersionDesc(r.lessonId()).stream().filter(x -> !x.getId().equals(q.getId()) && "PUBLISHED".equals(x.getStatus())).forEach(x -> x.setStatus("ARCHIVED"));
        quizzes.save(q);
        int pos = 1;
        for (QuestionReq x : r.questions()) {
            boolean mcq = "MCQ".equals(x.type());
            if (mcq) {
                var opts = x.options() == null ? List.<OptionReq>of() : x.options();
                if (opts.size() < 2) throw ApiException.bad("Each MCQ needs at least two options");
                if (opts.stream().filter(OptionReq::correct).count() != 1) throw ApiException.bad("Each MCQ needs exactly one correct option");
            }
            QuizQuestion qq = new QuizQuestion(); qq.setQuizId(q.getId()); qq.setType(x.type()); qq.setPrompt(x.prompt()); qq.setPoints(x.points());
            qq.setPosition(pos++); qq.setModelAnswer(x.modelAnswer()); qq.setGradingMode(mcq ? "AUTO" : "MANUAL");
            questions.save(qq);
            if (mcq) { int op = 1; for (OptionReq o : x.options()) {
                QuizOption qo = new QuizOption(); qo.setQuizQuestionId(qq.getId()); qo.setText(o.text()); qo.setCorrect(o.correct()); qo.setPosition(op++); options.save(qo);
            } }
        }
        return q;
    }

    /** Default: archive (hide, keep history). With permanent=true the quiz is removed for good; a quiz that has attempts also needs force=true, which deletes those attempts and their scores. */
    @DeleteMapping("/quizzes/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void remove(@PathVariable Long id, @RequestParam(defaultValue = "false") boolean permanent, @RequestParam(defaultValue = "false") boolean force) {
        Quiz q = quizzes.findById(id).orElseThrow(() -> ApiException.notFound("Quiz not found"));
        if (!permanent) { q.setStatus("ARCHIVED"); return; }
        var taken = attempts.findByQuizId(id);
        if (!taken.isEmpty()) {
            if (!force) throw ApiException.conflict("This quiz has " + taken.size() + " learner attempt(s). Confirm to delete them together with the quiz.");
            answers.deleteByAttemptIdIn(taken.stream().map(QuizAttempt::getId).toList());
            attempts.deleteAll(taken);
            attempts.flush();
        }
        quizzes.delete(q); // questions and options are removed by the database (ON DELETE CASCADE)
    }

    // ---- manual grading ----
    /** Every submitted attempt (newest first), optionally for one quiz and/or one status (AWAITING_REVIEW, GRADED). */
    @GetMapping("/attempts")
    public List<AttemptRow> allAttempts(@RequestParam(required = false) Long quizId, @RequestParam(required = false) String status) {
        var rows = attempts.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "submittedAt")).stream()
            .filter(a -> !"IN_PROGRESS".equals(a.getStatus()))
            .filter(a -> quizId == null || a.getQuizId().equals(quizId))
            .filter(a -> status == null || status.isBlank() || a.getStatus().equals(status))
            .limit(500).toList();
        var us = users.findAllById(rows.stream().map(QuizAttempt::getUserId).collect(Collectors.toSet())).stream().collect(Collectors.toMap(com.ilmpath.identity.User::getId, x -> x));
        var qz = quizzes.findAllById(rows.stream().map(QuizAttempt::getQuizId).collect(Collectors.toSet())).stream().collect(Collectors.toMap(Quiz::getId, x -> x));
        var ls = lessons.findAllById(qz.values().stream().map(Quiz::getLessonId).collect(Collectors.toSet())).stream().collect(Collectors.toMap(com.ilmpath.courses.Lesson::getId, x -> x));
        return rows.stream().map(a -> {
            var u = us.get(a.getUserId()); var q = qz.get(a.getQuizId()); var l = q == null ? null : ls.get(q.getLessonId());
            return new AttemptRow(a.getId(), u == null ? "" : u.getName(), u == null ? "" : u.getEmail(), u == null || u.getGender() == null ? null : u.getGender().name(),
                a.getQuizId(), q == null ? "" : q.getTitle(), q == null ? 1 : q.getVersion(), l == null ? "" : l.getTitle(), a.getStatus(),
                a.getScoreAwarded(), a.getScorePossible(), a.getPercentage(), a.getPassed(), a.getSubmittedAt());
        }).toList();
    }

    @GetMapping("/attempts/pending")
    public List<PendingAttempt> pending() {
        return attempts.findByStatusOrderBySubmittedAtAsc("AWAITING_REVIEW").stream().map(a -> new PendingAttempt(a.getId(),
            users.findById(a.getUserId()).map(u -> u.getName()).orElse("Learner"), quizzes.findById(a.getQuizId()).map(Quiz::getTitle).orElse(""), a.getSubmittedAt())).toList();
    }

    @GetMapping("/attempts/{id}")
    public QuizController.Result attempt(@PathVariable Long id) {
        return quizController.result(attempts.findById(id).orElseThrow(() -> ApiException.notFound("Attempt not found")));
    }

    @PatchMapping("/answers/{id}/grade")
    public QuizController.Result grade(@PathVariable Long id, @Valid @RequestBody GradeReq r) {
        return quizController.result(service.grade(id, r.points(), r.feedback()));
    }
}
