package com.ilmpath.identity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** One-time setup: creates the single administrator from environment variables if no admin exists. */
@Component
public class AdminSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String email, password, name;

    public AdminSeeder(UserRepository users, PasswordEncoder encoder, @Value("${ilmpath.admin.email}") String email,
                       @Value("${ilmpath.admin.password}") String password, @Value("${ilmpath.admin.name}") String name) {
        this.users = users; this.encoder = encoder; this.email = email; this.password = password; this.name = name;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.existsByRole(Role.ADMIN)) return;
        if (email.isBlank() || password.length() < 8) {
            log.warn("No administrator exists. Set ILMPATH_ADMIN_EMAIL and ILMPATH_ADMIN_PASSWORD (min 8 chars) and restart.");
            return;
        }
        User u = new User();
        u.setName(name); u.setEmail(email.trim().toLowerCase()); u.setPasswordHash(encoder.encode(password)); u.setRole(Role.ADMIN);
        users.save(u);
        log.info("Initial administrator created: {}", u.getEmail());
    }
}
