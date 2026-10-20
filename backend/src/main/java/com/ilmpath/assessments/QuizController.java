package com.ilmpath.assessments;

import com.ilmpath.common.ApiException;
import com.ilmpath.identity.CurrentUser;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class QuizController {
    public record OptionView(Long id, String text) {}
    public record QuestionView(Long id, String type, String prompt, int points, List<OptionView> options) {}
    public record AttemptBrief(Long id, String status, BigDecimal percentage, Boolean passed, Instant submittedAt, Integer scoreAwarded, Integer scorePossible) {}
    public record QuizView(Long id, String title, String instructions, int passPercentage, int totalPoints, int version,
                           List<QuestionView> questions, List<AttemptBrief> attempts) {}
    public record SavedAnswer(Long questionId, Long optionId, String text) {}
    public record AttemptState(Long attemptId, Instant startedAt, List<SavedAnswer> answers) {}
    public record AnswersReq(List<AssessmentService.AnswerIn> answers) {}
    public record OptionResult(Long id, String text, Boolean correct) {}
    public record QuestionResult(Long answerId, Long questionId, String type, String prompt, int points, Integer awarded, boolean pendingReview,
                                 String feedback, Long selectedOptionId, String textAnswer, String modelAnswer, List<OptionResult> options) {}
    public record Result(Long attemptId, Long quizId, String quizTitle, Long lessonId, String status, boolean finalScore, Integer scoreAwarded, Integer scorePossible,
                         BigDecimal percentage, Boolean passed, int passPercentage, Instant submittedAt, List<QuestionResult> questions) {}

    private final QuizRepository quizzes;
    private final QuizQuestionRepository questions;
    private final QuizOptionRepository options;
    private final QuizAttemptRepository attempts;
    private final QuizAnswerRepository answers;
    private final AssessmentService service;

    public QuizController(QuizRepository quizzes, QuizQuestionRepository questions, QuizOptionRepository options, QuizAttemptRepository attempts,
                          QuizAnswerRepository answers, AssessmentService service) {
        this.quizzes = quizzes; this.questions = questions; this.options = options; this.attempts = attempts; this.answers = answers; this.service = service;
    }

    @GetMapping("/lessons/{lessonId}/quiz")
    public QuizView forLesson(@PathVariable Long lessonId) {
        Quiz q = quizzes.findFirstByLessonIdAndStatusOrderByVersionDesc(lessonId, "PUBLISHED").orElseThrow(() -> ApiException.notFound("No quiz for this lesson"));
        var qs = questions.findByQuizIdOrderByPositionAscIdAsc(q.getId());
        var opts = options.findByQuizQuestionIdInOrderByPositionAscIdAsc(qs.stream().map(QuizQuestion::getId).toList())
            .stream().collect(Collectors.groupingBy(QuizOption::getQuizQuestionId));
        var views = qs.stream().map(x -> new QuestionView(x.getId(), x.getType(), x.getPrompt(), x.getPoints(),
            opts.getOrDefault(x.getId(), List.of()).stream().map(o -> new OptionView(o.getId(), o.getText())).toList())).toList();
        // attempts at any version of this lesson's quiz
        List<AttemptBrief> mine = quizzes.findByLessonIdOrderByVersionDesc(lessonId).stream()
            .flatMap(z -> attempts.findByUserIdAndQuizIdOrderByStartedAtDesc(CurrentUser.get().getId(), z.getId()).stream())
            .filter(a -> !"IN_PROGRESS".equals(a.getStatus()))
            .map(a -> new AttemptBrief(a.getId(), a.getStatus(), a.getPercentage(), a.getPassed(), a.getSubmittedAt(), a.getScoreAwarded(), a.getScorePossible())).toList();
        return new QuizView(q.getId(), q.getTitle(), q.getInstructions(), q.getPassPercentage(), qs.stream().mapToInt(QuizQuestion::getPoints).sum(), q.getVersion(), views, mine);
    }

    @GetMapping("/quizzes/{quizId}")
    public QuizView byId(@PathVariable Long quizId) {
        Quiz q = quizzes.findById(quizId).filter(x -> "PUBLISHED".equals(x.getStatus())).orElseThrow(() -> ApiException.notFound("Quiz not found"));
        return forLesson(q.getLessonId());
    }

    @PostMapping("/quizzes/{quizId}/attempts") @ResponseStatus(HttpStatus.CREATED)
    public AttemptState start(@PathVariable Long quizId) {
        QuizAttempt a = service.start(quizId, CurrentUser.get().getId());
        return new AttemptState(a.getId(), a.getStartedAt(),
            answers.findByAttemptId(a.getId()).stream().map(x -> new SavedAnswer(x.getQuizQuestionId(), x.getSelectedOptionId(), x.getTextAnswer())).toList());
    }

    @PutMapping("/attempts/{id}/answers") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@PathVariable Long id, @RequestBody AnswersReq r) {
        service.saveAnswers(service.ownedAttempt(id, CurrentUser.get().getId()), r.answers());
    }

    @PostMapping("/attempts/{id}/submit")
    public Result submit(@PathVariable Long id, @RequestBody(required = false) AnswersReq r) {
        QuizAttempt a = service.submit(service.ownedAttempt(id, CurrentUser.get().getId()), r == null ? null : r.answers());
        return result(a);
    }

    @GetMapping("/attempts/{id}/result")
    public Result get(@PathVariable Long id) {
        QuizAttempt a = service.ownedAttempt(id, CurrentUser.get().getId());
        if ("IN_PROGRESS".equals(a.getStatus())) throw ApiException.conflict("This attempt has not been submitted yet");
        return result(a);
    }

    public Result result(QuizAttempt a) {
        Quiz quiz = quizzes.findById(a.getQuizId()).orElseThrow();
        var qs = questions.findByQuizIdOrderByPositionAscIdAsc(quiz.getId());
        var opts = options.findByQuizQuestionIdInOrderByPositionAscIdAsc(qs.stream().map(QuizQuestion::getId).toList()).stream().collect(Collectors.groupingBy(QuizOption::getQuizQuestionId));
        Map<Long, QuizAnswer> ans = answers.findByAttemptId(a.getId()).stream().collect(Collectors.toMap(QuizAnswer::getQuizQuestionId, x -> x));
        var rows = qs.stream().map(q -> {
            QuizAnswer an = ans.get(q.getId());
            boolean mcq = "MCQ".equals(q.getType());
            return new QuestionResult(an == null ? null : an.getId(), q.getId(), q.getType(), q.getPrompt(), q.getPoints(),
                an == null ? null : an.getAwardedPoints(), !mcq && (an == null || an.getAwardedPoints() == null),
                an == null ? null : an.getFeedback(), an == null ? null : an.getSelectedOptionId(), an == null ? null : an.getTextAnswer(),
                mcq ? null : q.getModelAnswer(),
                opts.getOrDefault(q.getId(), List.of()).stream().map(o -> new OptionResult(o.getId(), o.getText(), o.isCorrect())).toList());
        }).toList();
        return new Result(a.getId(), quiz.getId(), quiz.getTitle(), quiz.getLessonId(), a.getStatus(), "GRADED".equals(a.getStatus()),
            a.getScoreAwarded(), a.getScorePossible(), a.getPercentage(), a.getPassed(), quiz.getPassPercentage(), a.getSubmittedAt(), rows);
    }
}
