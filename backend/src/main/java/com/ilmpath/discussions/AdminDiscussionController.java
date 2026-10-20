package com.ilmpath.discussions;

import com.ilmpath.common.ApiException;
import com.ilmpath.identity.CurrentUser;
import com.ilmpath.identity.Gender;
import com.ilmpath.identity.User;
import com.ilmpath.identity.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Administrator view over both gender groups. Every state-changing call here is recorded by the audit interceptor. */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminDiscussionController {
    public record RoomAdmin(Long id, String gender, String title, String description, String status, long postCount) {}
    public record RoomReq(@NotNull Gender gender, @NotBlank @Size(max = 160) String title, @Size(max = 500) String description) {}
    public record RoomUpdate(@NotBlank @Size(max = 160) String title, @Size(max = 500) String description, @Pattern(regexp = "ACTIVE|ARCHIVED") String status) {}
    public record PostAdmin(Long id, Long parentId, String body, String authorName, String authorEmail, boolean teacher, String status, Instant createdAt) {}
    public record PostBody(@NotBlank @Size(max = 2000) String body, Long parentId) {}
    public record PostStatus(@Pattern(regexp = "VISIBLE|HIDDEN") String status) {}

    private final DiscussionRoomRepository rooms;
    private final DiscussionPostRepository posts;
    private final UserRepository users;

    public AdminDiscussionController(DiscussionRoomRepository rooms, DiscussionPostRepository posts, UserRepository users) {
        this.rooms = rooms; this.posts = posts; this.users = users;
    }

    private RoomAdmin dto(DiscussionRoom r) {
        return new RoomAdmin(r.getId(), r.getGender().name(), r.getTitle(), r.getDescription(), r.getStatus(), posts.countByRoomIdAndStatus(r.getId(), "VISIBLE"));
    }

    @GetMapping("/rooms")
    public List<RoomAdmin> list() { return rooms.findAllByOrderByGenderAscIdAsc().stream().map(this::dto).toList(); }

    @PostMapping("/rooms") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public RoomAdmin create(@Valid @RequestBody RoomReq r) {
        DiscussionRoom x = new DiscussionRoom(); x.setGender(r.gender()); x.setTitle(r.title().trim()); x.setDescription(r.description());
        return dto(rooms.save(x));
    }

    @PutMapping("/rooms/{id}") @Transactional
    public RoomAdmin update(@PathVariable Long id, @Valid @RequestBody RoomUpdate r) {
        DiscussionRoom x = rooms.findById(id).orElseThrow(() -> ApiException.notFound("Room not found"));
        x.setTitle(r.title().trim()); x.setDescription(r.description());
        if (r.status() != null) x.setStatus(r.status());
        return dto(x);
    }

    @GetMapping("/rooms/{id}/posts")
    public List<PostAdmin> posts(@PathVariable Long id) {
        rooms.findById(id).orElseThrow(() -> ApiException.notFound("Room not found"));
        var ps = posts.findByRoomIdOrderByCreatedAtAsc(id);
        Map<String, User> authors = users.findAllById(ps.stream().map(DiscussionPost::getUserId).collect(Collectors.toSet())).stream().collect(Collectors.toMap(User::getId, Function.identity()));
        return ps.stream().map(p -> { User a = authors.get(p.getUserId());
            return new PostAdmin(p.getId(), p.getParentId(), p.getBody(), a == null ? "" : a.getName(), a == null ? "" : a.getEmail(), a != null && a.getRole() == com.ilmpath.identity.Role.ADMIN, p.getStatus(), p.getCreatedAt()); }).toList();
    }

    @PostMapping("/rooms/{id}/posts") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String, Long> teacherPost(@PathVariable Long id, @Valid @RequestBody PostBody req) {
        rooms.findById(id).orElseThrow(() -> ApiException.notFound("Room not found"));
        DiscussionPost p = new DiscussionPost(); p.setRoomId(id); p.setUserId(CurrentUser.get().getId()); p.setParentId(req.parentId()); p.setBody(req.body().trim());
        return Map.of("id", posts.save(p).getId());
    }

    @PatchMapping("/posts/{id}/status") @Transactional
    public Map<String, String> moderate(@PathVariable Long id, @Valid @RequestBody PostStatus r) {
        DiscussionPost p = posts.findById(id).orElseThrow(() -> ApiException.notFound("Post not found"));
        p.setStatus(r.status());
        return Map.of("status", p.getStatus());
    }
}
