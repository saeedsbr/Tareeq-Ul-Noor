package com.ilmpath.admin;

import com.ilmpath.assessments.QuizAttemptRepository;
import com.ilmpath.common.ApiException;
import com.ilmpath.courses.CourseRepository;
import com.ilmpath.identity.*;
import com.ilmpath.progress.LessonCompletionRepository;
import com.ilmpath.questions.*;
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
public class AdminCommunityController {
    public record ReplyReq(@NotBlank @Size(max = 5000) String body) {}
    public record StatusReq(@Pattern(regexp = "SUBMITTED|ANSWERED|RESOLVED|HIDDEN") String status) {}
    public record UserStatusReq(@Pattern(regexp = "ACTIVE|SUSPENDED") String status) {}
    public record UserAdmin(String id, String name, String email, String role, String gender, String status, Instant createdAt, long completedLessons) {}

    private final QuestionRepository questions;
    private final QuestionReplyRepository replies;
    private final QuestionService qs;
    private final UserRepository users;
    private final LessonCompletionRepository completions;
    private final CourseRepository courses;
    private final QuizAttemptRepository attempts;

    public AdminCommunityController(QuestionRepository questions, QuestionReplyRepository replies, QuestionService qs, UserRepository users,
                                    LessonCompletionRepository completions, CourseRepository courses, QuizAttemptRepository attempts) {
        this.questions = questions; this.replies = replies; this.qs = qs; this.users = users; this.completions = completions; this.courses = courses; this.attempts = attempts;
    }

    @GetMapping("/questions")
    public List<QuestionService.QuestionDto> inbox(@RequestParam(required = false) String status) {
        var list = status == null || status.isBlank() ? questions.findAll().stream().sorted(Comparator.comparing(Question::getCreatedAt).reversed()).toList()
            : questions.findByStatusOrderByCreatedAtDesc(status);
        return qs.toDtos(list, CurrentUser.get());
    }

    @PostMapping("/questions/{id}/replies") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public QuestionService.QuestionDto reply(@PathVariable Long id, @Valid @RequestBody ReplyReq r) {
        Question q = questions.findById(id).orElseThrow(() -> ApiException.notFound("Question not found"));
        QuestionReply x = new QuestionReply(); x.setQuestionId(id); x.setAdminUserId(CurrentUser.get().getId()); x.setBody(r.body().trim());
        replies.save(x);
        if ("SUBMITTED".equals(q.getStatus())) q.setStatus("ANSWERED");
        questions.save(q);
        return qs.toDtos(List.of(q), CurrentUser.get()).get(0);
    }

    @PatchMapping("/questions/{id}/status") @Transactional
    public QuestionService.QuestionDto status(@PathVariable Long id, @Valid @RequestBody StatusReq r) {
        Question q = questions.findById(id).orElseThrow(() -> ApiException.notFound("Question not found"));
        q.setStatus(r.status());
        return qs.toDtos(List.of(questions.save(q)), CurrentUser.get()).get(0);
    }

    @GetMapping("/users")
    public List<UserAdmin> users() {
        return users.findAll().stream().sorted(Comparator.comparing(User::getCreatedAt).reversed())
            .map(u -> new UserAdmin(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getGender() == null ? null : u.getGender().name(), u.getStatus(), u.getCreatedAt(), completions.countByUserId(u.getId()))).toList();
    }

    @PatchMapping("/users/{id}/status") @Transactional
    public UserAdmin userStatus(@PathVariable String id, @Valid @RequestBody UserStatusReq r) {
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
        if (u.getRole() == Role.ADMIN) throw ApiException.bad("The administrator account cannot be suspended");
        u.setStatus(r.status());
        return new UserAdmin(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getGender() == null ? null : u.getGender().name(), u.getStatus(), u.getCreatedAt(), completions.countByUserId(u.getId()));
    }

    @GetMapping("/reports/overview")
    public Map<String, Object> overview() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("learners", users.countByRole(Role.LEARNER));
        m.put("publishedCourses", courses.findByStatusOrderByPositionAscIdAsc("PUBLISHED").size());
        m.put("lessonCompletions", completions.count());
        m.put("pendingQuestions", questions.countByStatus("SUBMITTED"));
        m.put("attemptsAwaitingReview", attempts.findByStatusOrderBySubmittedAtAsc("AWAITING_REVIEW").size());
        m.put("quizAttempts", attempts.count());
        return m;
    }
}
