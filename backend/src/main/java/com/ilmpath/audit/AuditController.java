package com.ilmpath.audit;

import com.ilmpath.identity.User;
import com.ilmpath.identity.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AuditController {
    public record Entry(Long id, String admin, String action, String target, int status, Instant at) {}

    private final AuditLogRepository repo;
    private final UserRepository users;

    public AuditController(AuditLogRepository repo, UserRepository users) { this.repo = repo; this.users = users; }

    @GetMapping("/audit-log")
    public List<Entry> list(@RequestParam(defaultValue = "100") int limit) {
        var rows = repo.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.min(Math.max(limit, 1), 500)));
        Map<String, User> admins = users.findAllById(rows.stream().map(AuditLog::getAdminUserId).collect(Collectors.toSet())).stream().collect(Collectors.toMap(User::getId, Function.identity()));
        return rows.stream().map(r -> new Entry(r.getId(), admins.containsKey(r.getAdminUserId()) ? admins.get(r.getAdminUserId()).getName() : "", r.getAction(), r.getTarget(), r.getHttpStatus(), r.getCreatedAt())).toList();
    }
}
