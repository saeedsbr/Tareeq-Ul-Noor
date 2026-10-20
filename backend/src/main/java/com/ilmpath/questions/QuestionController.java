package com.ilmpath.questions;

import com.ilmpath.common.ApiException;
import com.ilmpath.common.RateLimiter;
import com.ilmpath.courses.LessonRepository;
import com.ilmpath.identity.CurrentUser;
import com.ilmpath.identity.Gender;
import com.ilmpath.identity.GenderScope;
import com.ilmpath.identity.User;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Questions are shared only inside the asker's gender group (plus the administrator).
 * Every read goes through a gender-scoped repository query; a question from the other group answers 404.
 */
@RestController
@RequestMapping("/api/v1")
public class QuestionController {
    public record AskReq(@NotBlank @Size(min = 5, max = 2000, message = "Please write between 5 and 2000 characters") String body) {}

    private final QuestionRepository questions;
    private final LessonRepository lessons;
    private final QuestionService service;
    private final QuestionReplyRepository replies;
    private final RateLimiter limiter;

    public QuestionController(QuestionRepository questions, LessonRepository lessons, QuestionService service, RateLimiter limiter, QuestionReplyRepository replies) {
        this.replies = replies; this.questions = questions; this.lessons = lessons; this.service = service; this.limiter = limiter;
    }

    @PostMapping("/lessons/{lessonId}/questions") @ResponseStatus(HttpStatus.CREATED)
    public QuestionService.QuestionDto ask(@PathVariable Long lessonId, @Valid @RequestBody AskReq r) {
        User me = CurrentUser.get();
        GenderScope.requireLearnerGender(me);
        limiter.check("ask:" + me.getId(), 10, Duration.ofHours(1));
        lessons.findById(lessonId).filter(l -> "PUBLISHED".equals(l.getStatus())).orElseThrow(() -> ApiException.notFound("Lesson not found"));
        Question q = new Question(); q.setUserId(me.getId()); q.setLessonId(lessonId); q.setBody(r.body().trim());
        questions.save(q);
        return service.toDtos(List.of(q), me).get(0);
    }

    /** Questions on this lesson from the caller's own gender group. */
    @GetMapping("/lessons/{lessonId}/questions")
    public List<QuestionService.QuestionDto> forLesson(@PathVariable Long lessonId) {
        User me = CurrentUser.get();
        Gender g = GenderScope.restrictedTo(me);
        return service.toDtos(g == null ? questions.findAllForLesson(lessonId) : questions.findForGenderAndLesson(g, lessonId), me);
    }

    /** Only the caller's own questions. */
    @GetMapping("/me/questions")
    public List<QuestionService.QuestionDto> mine() {
        User me = CurrentUser.get();
        return service.toDtos(questions.findByUserIdAndStatusNotOrderByCreatedAtDesc(me.getId(), "HIDDEN"), me);
    }

    /** All questions from the caller's gender group, optionally filtered by text. */
    @GetMapping("/community/questions")
    public List<QuestionService.QuestionDto> community(@RequestParam(required = false) String q) {
        User me = CurrentUser.get();
        Gender g = GenderScope.requireLearnerGender(me);
        String s = q == null ? "" : q.trim();
        if (s.length() > 100) throw ApiException.bad("Search text is too long");
        return service.toDtos(s.isEmpty() ? questions.findForGender(g) : questions.searchForGender(g, s), me);
    }

    @GetMapping("/questions/{id}")
    public QuestionService.QuestionDto one(@PathVariable Long id) {
        User me = CurrentUser.get();
        Gender g = GenderScope.requireLearnerGender(me);
        Question q = questions.findVisibleTo(id, g).orElseThrow(() -> ApiException.notFound("Question not found"));
        return service.toDtos(List.of(q), me).get(0);
    }

    public record ReplyReq(@NotBlank @Size(min = 1, max = 2000, message = "Please keep it under 2000 characters") String body) {}

    /** Comment-style reply from anyone in the same gender group. */
    @PostMapping("/questions/{id}/replies") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public QuestionService.QuestionDto reply(@PathVariable Long id, @Valid @RequestBody ReplyReq r) {
        User me = CurrentUser.get();
        Gender g = GenderScope.requireLearnerGender(me);
        limiter.check("reply:" + me.getId(), 30, Duration.ofMinutes(10));
        Question q = questions.findVisibleTo(id, g).orElseThrow(() -> ApiException.notFound("Question not found"));
        QuestionReply x = new QuestionReply(); x.setQuestionId(q.getId()); x.setUserId(me.getId()); x.setBody(r.body().trim());
        replies.save(x);
        return service.toDtos(List.of(q), me).get(0);
    }

    @DeleteMapping("/questions/{qid}/replies/{rid}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deleteReply(@PathVariable Long qid, @PathVariable Long rid) {
        User me = CurrentUser.get();
        replies.findById(rid).filter(x -> x.getQuestionId().equals(qid) && x.getUserId().equals(me.getId()))
            .orElseThrow(() -> ApiException.notFound("Reply not found")).setStatus("HIDDEN");
    }

    @DeleteMapping("/questions/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deleteOwn(@PathVariable Long id) {
        User me = CurrentUser.get();
        questions.findById(id).filter(x -> x.getUserId().equals(me.getId())).orElseThrow(() -> ApiException.notFound("Question not found")).setStatus("HIDDEN");
    }

    @PatchMapping("/questions/{id}/resolve")
    public QuestionService.QuestionDto resolve(@PathVariable Long id) {
        User me = CurrentUser.get();
        Question q = questions.findById(id).filter(x -> x.getUserId().equals(me.getId()))
            .orElseThrow(() -> ApiException.notFound("Question not found"));
        q.setStatus("RESOLVED");
        questions.save(q);
        return service.toDtos(List.of(q), me).get(0);
    }
}
