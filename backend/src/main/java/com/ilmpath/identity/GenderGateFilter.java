package com.ilmpath.identity;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Learners without a stored gender can only read their own profile, choose a gender, sign out and browse the public catalogue.
 * Everything else answers 403 GENDER_REQUIRED, so the rule holds even if the frontend is bypassed.
 * Not a @Component on purpose: it must run inside the security chain, after authentication.
 */
public class GenderGateFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a != null && a.getPrincipal() instanceof User u && u.getRole() == Role.LEARNER && u.getGender() == null && !allowed(req)) {
            res.setStatus(403);
            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
            res.getWriter().write("{\"status\":403,\"code\":\"GENDER_REQUIRED\",\"message\":\"Please choose your gender to continue\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    private static boolean allowed(HttpServletRequest req) {
        String p = req.getRequestURI(), m = req.getMethod();
        if (!p.startsWith("/api/v1/")) return true;
        if (p.startsWith("/api/v1/auth/")) return true;
        if (p.equals("/api/v1/me") && m.equals("GET")) return true;
        if (p.equals("/api/v1/me/gender") && m.equals("PUT")) return true;
        return m.equals("GET") && (p.equals("/api/v1/courses") || p.startsWith("/api/v1/courses/"));
    }
}
