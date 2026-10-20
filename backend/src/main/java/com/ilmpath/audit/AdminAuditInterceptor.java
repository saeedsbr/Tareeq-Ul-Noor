package com.ilmpath.audit;

import com.ilmpath.identity.Role;
import com.ilmpath.identity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

/** Records every state-changing admin request (who, what, when, outcome). Request bodies are deliberately not stored. */
@Component
public class AdminAuditInterceptor implements HandlerInterceptor {
    private static final Logger log = LoggerFactory.getLogger(AdminAuditInterceptor.class);
    private static final Set<String> READ = Set.of("GET", "HEAD", "OPTIONS");
    private final AuditLogRepository repo;

    public AdminAuditInterceptor(AuditLogRepository repo) { this.repo = repo; }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res, Object handler, Exception ex) {
        if (READ.contains(req.getMethod())) return;
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !(a.getPrincipal() instanceof User u) || u.getRole() != Role.ADMIN) return;
        try {
            Object pattern = req.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
            AuditLog e = new AuditLog();
            e.setAdminUserId(u.getId());
            e.setAction(req.getMethod() + " " + (pattern != null ? pattern : req.getRequestURI()));
            e.setTarget(req.getRequestURI());
            e.setHttpStatus(ex != null ? 500 : res.getStatus());
            repo.save(e);
        } catch (Exception e) {
            log.warn("Could not write audit log entry", e);
        }
    }
}
