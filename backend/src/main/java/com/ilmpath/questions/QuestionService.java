package com.ilmpath.questions;

import com.ilmpath.courses.*;
import com.ilmpath.identity.User;
import com.ilmpath.identity.UserRepository;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class QuestionService {
    public record ReplyDto(Long id, String body, String authorName, boolean teacher, boolean mine, Instant createdAt, Instant editedAt, int likes, int myReaction) {}
    public record QuestionDto(Long id, String body, String status, Long lessonId, String lessonTitle, String courseTitle,
                              String learnerName, String learnerEmail, String gender, String askedBy, boolean mine, Instant createdAt, Instant editedAt, int likes, int myReaction, List<ReplyDto> replies) {}

    private final LessonRepository lessons;
    private final CourseRepository courses;
    private final QuestionReplyRepository replies;
    private final UserRepository users;
    private final CommentReactionRepository reactions;

    public QuestionService(LessonRepository lessons, CourseRepository courses, QuestionReplyRepository replies, UserRepository users, CommentReactionRepository reactions) {
        this.reactions = reactions; this.lessons = lessons; this.courses = courses; this.replies = replies; this.users = users;
    }

    private static int[] tally(List<CommentReaction> all, Long id, String viewerId) {
        int likes = 0, mine = 0;
        for (CommentReaction c : all) if (c.getTargetId().equals(id)) { if (c.getValue() > 0) likes++; if (c.getUserId().equals(viewerId)) mine = c.getValue(); }
        return new int[] { likes, mine };
    }

    private static ReplyDto replyDto(QuestionReply r, User author, User viewer, List<CommentReaction> rx) {
        boolean teacher = author != null && author.getRole() == com.ilmpath.identity.Role.ADMIN;
        String name = author == null ? "" : teacher ? author.getName() : author.getName().trim().split("\\s+")[0];
        int[] t = tally(rx, r.getId(), viewer.getId());
        return new ReplyDto(r.getId(), r.getBody(), name, teacher, r.getUserId().equals(viewer.getId()), r.getCreatedAt(), r.getEditedAt(), t[0], t[1]);
    }

    /** Learners get a first name only; administrators additionally get full name, email and gender. */
    public List<QuestionDto> toDtos(List<Question> qs, User viewer) {
        boolean admin = viewer.getRole() == com.ilmpath.identity.Role.ADMIN;
        if (qs.isEmpty()) return List.of();
        Map<Long, Lesson> ls = lessons.findAllById(qs.stream().map(Question::getLessonId).collect(Collectors.toSet()))
            .stream().collect(Collectors.toMap(Lesson::getId, Function.identity()));
        Map<Long, Course> cs = courses.findAllById(ls.values().stream().map(Lesson::getCourseId).collect(Collectors.toSet()))
            .stream().collect(Collectors.toMap(Course::getId, Function.identity()));
        var rs = replies.findByQuestionIdInAndStatusOrderByCreatedAtAsc(qs.stream().map(Question::getId).toList(), "VISIBLE");
        var qRx = reactions.findByTargetTypeAndTargetIdIn("QUESTION", qs.stream().map(Question::getId).toList());
        var replyRx = rs.isEmpty() ? List.<CommentReaction>of() : reactions.findByTargetTypeAndTargetIdIn("REPLY", rs.stream().map(QuestionReply::getId).toList());
        Map<String, User> us = users.findAllById(rs.stream().map(QuestionReply::getUserId).collect(Collectors.toSet()))
            .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        Map<String, User> learners = users.findAllById(qs.stream().map(Question::getUserId).collect(Collectors.toSet())).stream().collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, List<ReplyDto>> byQ = new HashMap<>();
        for (var r : rs) byQ.computeIfAbsent(r.getQuestionId(), k -> new ArrayList<>())
            .add(replyDto(r, us.get(r.getUserId()), viewer, replyRx));
        return qs.stream().map(q -> {
            Lesson l = ls.get(q.getLessonId());
            Course c = l == null ? null : cs.get(l.getCourseId());
            User lu = learners.get(q.getUserId());
            return new QuestionDto(q.getId(), q.getBody(), q.getStatus(), q.getLessonId(), l == null ? "" : l.getTitle(), c == null ? "" : c.getTitle(),
                admin && lu != null ? lu.getName() : null, admin && lu != null ? lu.getEmail() : null,
                lu == null || lu.getGender() == null ? null : lu.getGender().name(),
                lu == null ? "" : lu.getName().trim().split("\\s+")[0], q.getUserId().equals(viewer.getId()),
                q.getCreatedAt(), q.getEditedAt(), tally(qRx, q.getId(), viewer.getId())[0], tally(qRx, q.getId(), viewer.getId())[1], byQ.getOrDefault(q.getId(), List.of()));
        }).toList();
    }
}
