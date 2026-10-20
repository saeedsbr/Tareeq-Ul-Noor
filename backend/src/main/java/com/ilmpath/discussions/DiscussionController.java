package com.ilmpath.discussions;

import com.ilmpath.common.ApiException;
import com.ilmpath.common.RateLimiter;
import com.ilmpath.identity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * Gender-separated discussion rooms. A room is only ever looked up together with the caller's gender
 * (repository finder), so a room of the other group is indistinguishable from a room that does not exist (404).
 */
@RestController
@RequestMapping("/api/v1")
public class DiscussionController {
    public record RoomDto(Long id, String title, String description, long postCount) {}
    public record PostDto(Long id, Long parentId, String body, String authorName, boolean teacher, boolean mine, Instant createdAt) {}
    public record PostReq(@NotBlank @Size(max = 2000, message = "Please keep it under 2000 characters") String body, Long parentId) {}

    private final DiscussionRoomRepository rooms;
    private final DiscussionPostRepository posts;
    private final UserRepository users;
    private final RateLimiter limiter;

    public DiscussionController(DiscussionRoomRepository rooms, DiscussionPostRepository posts, UserRepository users, RateLimiter limiter) {
        this.rooms = rooms; this.posts = posts; this.users = users; this.limiter = limiter;
    }

    private DiscussionRoom roomFor(User me, Long id) {
        Gender g = GenderScope.requireLearnerGender(me);
        return rooms.findByIdAndGenderAndStatus(id, g, "ACTIVE").orElseThrow(() -> ApiException.notFound("Discussion room not found"));
    }

    @GetMapping("/rooms")
    public List<RoomDto> list() {
        Gender g = GenderScope.requireLearnerGender(CurrentUser.get());
        return rooms.findByGenderAndStatusOrderByIdAsc(g, "ACTIVE").stream()
            .map(r -> new RoomDto(r.getId(), r.getTitle(), r.getDescription(), posts.countByRoomIdAndStatus(r.getId(), "VISIBLE"))).toList();
    }

    @GetMapping("/rooms/{id}")
    public RoomDto room(@PathVariable Long id) {
        DiscussionRoom r = roomFor(CurrentUser.get(), id);
        return new RoomDto(r.getId(), r.getTitle(), r.getDescription(), posts.countByRoomIdAndStatus(r.getId(), "VISIBLE"));
    }

    @GetMapping("/rooms/{id}/posts")
    public List<PostDto> posts(@PathVariable Long id, @RequestParam(required = false) String q) {
        User me = CurrentUser.get();
        DiscussionRoom r = roomFor(me, id);
        String s = q == null ? "" : q.trim();
        if (s.length() > 100) throw ApiException.bad("Search text is too long");
        return toDtos(s.isEmpty() ? posts.findByRoomIdAndStatusOrderByCreatedAtAsc(r.getId(), "VISIBLE") : posts.search(r.getId(), s), me);
    }

    @PostMapping("/rooms/{id}/posts") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public PostDto post(@PathVariable Long id, @Valid @RequestBody PostReq req) {
        User me = CurrentUser.get();
        DiscussionRoom r = roomFor(me, id);
        limiter.check("post:" + me.getId(), 20, Duration.ofMinutes(10));
        if (req.parentId() != null)
            posts.findById(req.parentId()).filter(p -> p.getRoomId().equals(r.getId()) && "VISIBLE".equals(p.getStatus()))
                .orElseThrow(() -> ApiException.bad("The post you are replying to was not found in this room"));
        DiscussionPost p = new DiscussionPost(); p.setRoomId(r.getId()); p.setUserId(me.getId()); p.setParentId(req.parentId()); p.setBody(req.body().trim());
        posts.save(p);
        return toDtos(List.of(p), me).get(0);
    }

    /** Authors can remove their own posts (hidden, not erased, so moderators keep the record). */
    @DeleteMapping("/rooms/{roomId}/posts/{postId}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deleteOwn(@PathVariable Long roomId, @PathVariable Long postId) {
        User me = CurrentUser.get();
        DiscussionRoom r = roomFor(me, roomId);
        DiscussionPost p = posts.findById(postId).filter(x -> x.getRoomId().equals(r.getId()) && x.getUserId().equals(me.getId()))
            .orElseThrow(() -> ApiException.notFound("Post not found"));
        p.setStatus("HIDDEN");
    }

    List<PostDto> toDtos(List<DiscussionPost> ps, User viewer) {
        Map<String, User> authors = users.findAllById(ps.stream().map(DiscussionPost::getUserId).collect(Collectors.toSet()))
            .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        return ps.stream().map(p -> {
            User a = authors.get(p.getUserId());
            boolean teacher = a != null && a.getRole() == Role.ADMIN;
            String name = a == null ? "" : teacher ? a.getName() : a.getName().trim().split("\\s+")[0];
            return new PostDto(p.getId(), p.getParentId(), p.getBody(), name, teacher, p.getUserId().equals(viewer.getId()), p.getCreatedAt());
        }).toList();
    }
}
