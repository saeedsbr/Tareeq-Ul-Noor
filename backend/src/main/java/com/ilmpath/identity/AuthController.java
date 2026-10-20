package com.ilmpath.identity;

import com.ilmpath.common.ApiException;
import com.ilmpath.common.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    public record RegisterReq(@NotBlank @Size(max = 120) String name, @NotBlank @Email @Size(max = 190) String email,
                              @NotBlank @Size(min = 8, max = 72, message = "Password must be 8-72 characters") String password,
                              @NotNull(message = "Please select your gender") Gender gender) {}
    public record GenderReq(@NotNull(message = "Please select your gender") Gender gender) {}
    public record LoginReq(@NotBlank String email, @NotBlank String password) {}
    public record ForgotReq(@NotBlank @Email String email) {}
    public record ResetReq(@NotBlank String token, @NotBlank @Size(min = 8, max = 72) String password) {}
    public record PasswordReq(@NotBlank String currentPassword, @NotBlank @Size(min = 8, max = 72, message = "Password must be 8-72 characters") String newPassword) {}
    public record ProfileReq(@NotBlank @Size(max = 120) String name) {}
    public record UserDto(String id, String name, String email, String role, String gender) {
        static UserDto of(User u) { return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getGender() == null ? null : u.getGender().name()); }
    }

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final RateLimiter limiter;
    private final boolean secure;
    private final String webOrigin;

    public AuthController(UserRepository users, PasswordResetTokenRepository tokens, PasswordEncoder encoder, JwtService jwt,
                          RateLimiter limiter, @Value("${ilmpath.cookie-secure}") boolean secure, @Value("${ilmpath.cors-origin}") String webOrigin) {
        this.users = users; this.tokens = tokens; this.encoder = encoder; this.jwt = jwt; this.limiter = limiter;
        this.secure = secure; this.webOrigin = webOrigin;
    }

    private void setCookie(HttpServletResponse res, String value, Duration age) {
        ResponseCookie c = ResponseCookie.from(JwtAuthFilter.COOKIE, value).httpOnly(true).secure(secure)
            .sameSite("Lax").path("/").maxAge(age).build();
        res.addHeader(HttpHeaders.SET_COOKIE, c.toString());
    }

    @PostMapping("/auth/register") @ResponseStatus(HttpStatus.CREATED)
    public UserDto register(@Valid @RequestBody RegisterReq r, HttpServletRequest req, HttpServletResponse res) {
        limiter.check("register:" + req.getRemoteAddr(), 10, Duration.ofHours(1));
        if (users.existsByEmailIgnoreCase(r.email())) throw ApiException.conflict("An account with this email already exists");
        User u = new User();
        u.setName(r.name().trim()); u.setEmail(r.email().trim().toLowerCase());
        u.setPasswordHash(encoder.encode(r.password())); u.setRole(Role.LEARNER); u.setGender(r.gender());
        users.save(u);
        setCookie(res, jwt.issue(u), jwt.ttl());
        return UserDto.of(u);
    }

    @PostMapping("/auth/login")
    public UserDto login(@Valid @RequestBody LoginReq r, HttpServletRequest req, HttpServletResponse res) {
        limiter.check("login:" + req.getRemoteAddr(), 10, Duration.ofMinutes(10));
        User u = users.findByEmailIgnoreCase(r.email().trim())
            .filter(x -> encoder.matches(r.password(), x.getPasswordHash())).filter(User::isActive)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        setCookie(res, jwt.issue(u), jwt.ttl());
        return UserDto.of(u);
    }

    @PostMapping("/auth/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletResponse res) { setCookie(res, "", Duration.ZERO); }

    @PostMapping("/auth/forgot-password") @ResponseStatus(HttpStatus.ACCEPTED)
    @Transactional
    public Map<String, String> forgot(@Valid @RequestBody ForgotReq r, HttpServletRequest req) {
        limiter.check("forgot:" + req.getRemoteAddr(), 5, Duration.ofHours(1));
        users.findByEmailIgnoreCase(r.email().trim()).ifPresent(u -> {
            byte[] raw = new byte[32]; new SecureRandom().nextBytes(raw);
            String token = HexFormat.of().formatHex(raw);
            PasswordResetToken t = new PasswordResetToken();
            t.setUserId(u.getId()); t.setTokenHash(hash(token)); t.setExpiresAt(Instant.now().plus(Duration.ofHours(1)));
            tokens.save(t);
            // TODO: send by email. Until a mail provider is configured the link is written to the server log.
            log.info("Password reset link for {}: {}/reset-password?token={}", u.getEmail(), webOrigin, token);
        });
        return Map.of("message", "If that email exists, a reset link has been sent.");
    }

    @PostMapping("/auth/reset-password") @Transactional
    public Map<String, String> reset(@Valid @RequestBody ResetReq r) {
        PasswordResetToken t = tokens.findByTokenHash(hash(r.token()))
            .filter(x -> !x.isUsed() && x.getExpiresAt().isAfter(Instant.now()))
            .orElseThrow(() -> ApiException.bad("This reset link is invalid or has expired"));
        User u = users.findById(t.getUserId()).orElseThrow(() -> ApiException.bad("Invalid reset link"));
        u.setPasswordHash(encoder.encode(r.password()));
        t.setUsed(true);
        return Map.of("message", "Password updated. You can now sign in.");
    }

    @GetMapping("/me")
    public UserDto me() { return UserDto.of(CurrentUser.get()); }

    /** One-time gender selection for accounts that don't have one yet. Cannot be used to change an existing value. */
    @PutMapping("/me/gender") @Transactional
    public UserDto chooseGender(@Valid @RequestBody GenderReq r) {
        User me = CurrentUser.get();
        if (me.getRole() != Role.LEARNER) throw ApiException.bad("Gender selection applies to learner accounts only");
        if (users.setGenderOnce(me.getId(), r.gender()) == 0) throw ApiException.conflict("Your gender has already been set and cannot be changed");
        return UserDto.of(users.findById(me.getId()).orElseThrow());
    }

    @PatchMapping("/me") @Transactional
    public UserDto updateProfile(@Valid @RequestBody ProfileReq r) {
        User u = users.findById(CurrentUser.get().getId()).orElseThrow();
        u.setName(r.name().trim());
        return UserDto.of(u);
    }

    @PutMapping("/me/password") @Transactional
    public Map<String, String> changePassword(@Valid @RequestBody PasswordReq r) {
        User u = users.findById(CurrentUser.get().getId()).orElseThrow();
        limiter.check("pwd:" + u.getId(), 5, Duration.ofMinutes(15));
        if (!encoder.matches(r.currentPassword(), u.getPasswordHash())) throw ApiException.bad("Your current password is incorrect");
        if (encoder.matches(r.newPassword(), u.getPasswordHash())) throw ApiException.bad("Choose a password different from your current one");
        u.setPasswordHash(encoder.encode(r.newPassword()));
        return Map.of("message", "Password updated");
    }

    private static String hash(String s) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
}
