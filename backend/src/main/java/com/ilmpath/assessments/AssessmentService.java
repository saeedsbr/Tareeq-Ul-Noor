package com.ilmpath.assessments;

import com.ilmpath.common.ApiException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssessmentService {
    public record AnswerIn(Long questionId, Long optionId, String text) {}

    private final QuizRepository quizzes;
    private final QuizQuestionRepository questions;
    private final QuizOptionRepository options;
    private final QuizAttemptRepository attempts;
    private final QuizAnswerRepository answers;

    public AssessmentService(QuizRepository quizzes, QuizQuestionRepository questions, QuizOptionRepository options,
                             QuizAttemptRepository attempts, QuizAnswerRepository answers) {
        this.quizzes = quizzes; this.questions = questions; this.options = options; this.attempts = attempts; this.answers = answers;
    }

    /** points awarded / points possible * 100, two decimals. Possible must be > 0. */
    public static BigDecimal percentage(int awarded, int possible) {
        if (possible <= 0) throw ApiException.bad("Quiz has no points available");
        return BigDecimal.valueOf(awarded * 100.0 / possible).setScale(2, RoundingMode.HALF_UP);
    }

    public QuizAttempt ownedAttempt(Long attemptId, String userId) {
        return attempts.findById(attemptId).filter(a -> a.getUserId().equals(userId)).orElseThrow(() -> ApiException.notFound("Attempt not found"));
    }

    @Transactional
    public QuizAttempt start(Long quizId, String userId) {
        Quiz q = quizzes.findById(quizId).filter(x -> "PUBLISHED".equals(x.getStatus())).orElseThrow(() -> ApiException.notFound("Quiz not found"));
        return attempts.findFirstByUserIdAndQuizIdAndStatus(userId, q.getId(), "IN_PROGRESS").orElseGet(() -> {
            QuizAttempt a = new QuizAttempt(); a.setQuizId(q.getId()); a.setUserId(userId);
            return attempts.save(a);
        });
    }

    @Transactional
    public void saveAnswers(QuizAttempt a, List<AnswerIn> in) {
        if (!"IN_PROGRESS".equals(a.getStatus())) throw ApiException.conflict("This attempt has already been submitted");
        if (in == null) return;
        Map<Long, QuizQuestion> qs = questions.findByQuizIdOrderByPositionAscIdAsc(a.getQuizId()).stream().collect(Collectors.toMap(QuizQuestion::getId, x -> x));
        Map<Long, Set<Long>> optIds = options.findByQuizQuestionIdInOrderByPositionAscIdAsc(qs.keySet()).stream()
            .collect(Collectors.groupingBy(QuizOption::getQuizQuestionId, Collectors.mapping(QuizOption::getId, Collectors.toSet())));
        for (AnswerIn x : in) {
            QuizQuestion q = qs.get(x.questionId());
            if (q == null) throw ApiException.bad("Unknown question " + x.questionId());
            QuizAnswer ans = answers.findByAttemptIdAndQuizQuestionId(a.getId(), q.getId()).orElseGet(() -> {
                QuizAnswer n = new QuizAnswer(); n.setAttemptId(a.getId()); n.setQuizQuestionId(q.getId()); return n;
            });
            if ("MCQ".equals(q.getType())) {
                if (x.optionId() != null && !optIds.getOrDefault(q.getId(), Set.of()).contains(x.optionId())) throw ApiException.bad("Invalid option");
                ans.setSelectedOptionId(x.optionId());
            } else {
                String t = x.text() == null ? null : x.text().trim();
                if (t != null && t.length() > 5000) throw ApiException.bad("Answer is too long");
                ans.setTextAnswer(t);
            }
            answers.save(ans);
        }
    }

    /** Idempotent: a second submit returns the stored result without re-scoring. */
    @Transactional
    public QuizAttempt submit(QuizAttempt a, List<AnswerIn> finalAnswers) {
        if (!"IN_PROGRESS".equals(a.getStatus())) return a;
        saveAnswers(a, finalAnswers);
        Quiz quiz = quizzes.findById(a.getQuizId()).orElseThrow();
        List<QuizQuestion> qs = questions.findByQuizIdOrderByPositionAscIdAsc(quiz.getId());
        Map<Long, QuizOption> correct = new HashMap<>();
        options.findByQuizQuestionIdInOrderByPositionAscIdAsc(qs.stream().map(QuizQuestion::getId).toList())
            .stream().filter(QuizOption::isCorrect).forEach(o -> correct.put(o.getQuizQuestionId(), o));
        Map<Long, QuizAnswer> byQ = answers.findByAttemptId(a.getId()).stream().collect(Collectors.toMap(QuizAnswer::getQuizQuestionId, x -> x));
        int possible = 0, awarded = 0; boolean pending = false;
        for (QuizQuestion q : qs) {
            possible += q.getPoints();
            QuizAnswer ans = byQ.get(q.getId());
            if (ans == null) { ans = new QuizAnswer(); ans.setAttemptId(a.getId()); ans.setQuizQuestionId(q.getId()); }
            if ("MCQ".equals(q.getType())) {
                QuizOption c = correct.get(q.getId());
                int p = c != null && c.getId().equals(ans.getSelectedOptionId()) ? q.getPoints() : 0;
                ans.setAwardedPoints(p); awarded += p;
            } else { ans.setAwardedPoints(null); pending = true; }
            answers.save(ans);
        }
        a.setSubmittedAt(Instant.now());
        a.setScorePossible(possible); a.setScoreAwarded(awarded);
        a.setPercentage(percentage(awarded, possible));
        a.setStatus(pending ? "AWAITING_REVIEW" : "GRADED");
        a.setPassed(pending ? null : a.getPercentage().intValue() >= quiz.getPassPercentage());
        return attempts.save(a);
    }

    @Transactional
    public QuizAttempt grade(Long answerId, int points, String feedback) {
        QuizAnswer ans = answers.findById(answerId).orElseThrow(() -> ApiException.notFound("Answer not found"));
        QuizQuestion q = questions.findById(ans.getQuizQuestionId()).orElseThrow();
        if ("MCQ".equals(q.getType())) throw ApiException.bad("MCQ answers are scored automatically");
        if (points < 0 || points > q.getPoints()) throw ApiException.bad("Points must be between 0 and " + q.getPoints());
        ans.setAwardedPoints(points); ans.setFeedback(feedback);
        answers.save(ans);
        QuizAttempt a = attempts.findById(ans.getAttemptId()).orElseThrow();
        Quiz quiz = quizzes.findById(a.getQuizId()).orElseThrow();
        List<QuizAnswer> all = answers.findByAttemptId(a.getId());
        int sum = all.stream().mapToInt(x -> x.getAwardedPoints() == null ? 0 : x.getAwardedPoints()).sum();
        boolean pending = all.stream().anyMatch(x -> x.getAwardedPoints() == null);
        a.setScoreAwarded(sum); a.setPercentage(percentage(sum, a.getScorePossible()));
        a.setStatus(pending ? "AWAITING_REVIEW" : "GRADED");
        a.setPassed(pending ? null : a.getPercentage().intValue() >= quiz.getPassPercentage());
        return attempts.save(a);
    }
}
