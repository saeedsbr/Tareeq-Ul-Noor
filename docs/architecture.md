# Architecture

```
Browser (learner / admin)
   │ HTTPS
   ▼
Next.js 14 (App Router, TypeScript, Tailwind)      port 3000
   │  /api/* rewritten to the API (same origin → HttpOnly cookie works)
   ▼
Spring Boot 3.2 modular monolith (Java 21)         port 8080
   │ JPA + Flyway
   ▼
MySQL 8
```

The frontend displays data and collects input. The backend is authoritative for permissions, progress, scoring, publication status and validation.

## Repository
```
backend/    Spring Boot API (com.ilmpath.*)
frontend/   Next.js app (src/app, src/components, src/lib)
infra/      mysql-setup.sql, docker-compose.yml (MySQL only)
docs/       this documentation
```

## Backend modules (`backend/src/main/java/com/ilmpath`)
| Package | Responsibility |
|---|---|
| `identity` | Users, roles, registration/login/logout, password reset, JWT cookie filter, security config, admin seeder, optional demo seeder |
| `courses` | Courses, lessons, lesson resources; public catalogue (`CatalogController`) and lesson player data (`LessonController`) |
| `progress` | Lesson completions, progress calculation (`ProgressService`), learner dashboard |
| `questions` | Lesson-linked questions, admin replies, DTO mapping |
| `assessments` | Quizzes, versions, questions, options, attempts, answers, scoring and grading (`AssessmentService`) |
| `resources` | Notes and benefits, learner library |
| `admin` | Admin-only controllers: content, assessments/grading, questions/users/reports |
| `common` | `ApiException`, global error handler, in-memory `RateLimiter`, YouTube URL allowlist, slug helper |

DTOs are Java records; entities are never returned directly. Business rules live in services; controllers stay thin where logic is non-trivial.

## Authentication & authorization
- Passwords hashed with BCrypt (cost 12).
- Login/registration issue a signed JWT (HS256) stored in a `Secure`-configurable, `HttpOnly`, `SameSite=Lax` cookie `ilm_token`. A `Bearer` header is also accepted.
- CSRF protection is disabled deliberately: the API is stateless, JSON-only and relies on SameSite=Lax cookies. Revisit if cross-site embedding is ever needed.
- Route rules: `/api/v1/auth/**` and `GET /api/v1/courses/**` are public; `/api/v1/admin/**` requires `ROLE_ADMIN`; all other `/api/v1/**` requires sign-in. Ownership checks (questions, attempts, progress) are enforced in code by user id.
- Suspended users cannot authenticate (filter loads the user and requires `ACTIVE`).
- Rate limits (in-memory, per instance): login 10/10 min per IP, registration 10/h per IP, password-reset requests 5/h per IP, questions 10/h per user.
- Videos: only YouTube URLs are accepted and stored as `youtube-nocookie.com/embed/<id>`; no arbitrary iframe HTML.

## Quiz lifecycle
1. `POST /quizzes/{id}/attempts` creates (or resumes) an in-progress attempt.
2. `PUT /attempts/{id}/answers` autosaves; options are validated against the question.
3. `POST /attempts/{id}/submit` scores MCQs, marks written answers pending, sets status `GRADED` or `AWAITING_REVIEW`. Calling submit again returns the stored result (idempotent).
4. Admin grades written answers (`PATCH /admin/answers/{id}/grade`); when none are pending the attempt becomes `GRADED` and `passed` is set.
5. Editing a quiz with attempts archives the old row and creates `version + 1`.

## Frontend structure (`frontend/src`)
- `app/` — routes. `(app)/` group = learner pages inside `AppShell` (sidebar on desktop, bottom nav on mobile). `admin/` = admin pages inside `AppShell admin`. Public pages (`/`, `/courses`) are Server Components; interactive pages are client components.
- `components/` — `AppShell`, `PublicHeader/Footer`, `CourseCard`, `Modal`, `ui` (progress bar, badges, empty/error/loading states, field), `AuthShell`, `Logo`.
- `lib/` — typed API client (`api.ts`), auth hooks (`auth.tsx`: `useMe`, `useRequireUser`, `useLogout`), shared types, formatting helpers.
- Forms: React Hook Form + Zod (login, register, ask question); TanStack Query for data and mutations.
- `next.config.mjs` rewrites `/api/*` to `API_URL` (default `http://localhost:8080`).
- Route guards on the client are a convenience; the backend enforces access.

## Gender separation (added)
- `users.gender` (`MALE`/`FEMALE`, NULL until chosen). The JPA field is `updatable=false`; the only write path after registration is `UserRepository.setGenderOnce`, an `UPDATE ... WHERE gender IS NULL`, so a second attempt changes nothing and the API answers 409.
- `GenderGateFilter` (inside the security chain) answers `403 GENDER_REQUIRED` to every API call from a learner without a gender except `GET /me`, `PUT /me/gender`, auth and the public catalogue.
- `GenderScope` decides the visible group per request (learner → own gender, administrator → unrestricted). Questions are filtered inside the repository query (`userId in (select id from User where gender = :g)`); discussion rooms are always looked up together with the caller's gender, so other-group resources return 404.
- `AdminAuditInterceptor` records every non-GET request to `/api/v1/admin/**` in `admin_audit_log` (admin, method + route pattern, path, HTTP status; request bodies are not stored).
- Frontend: `AppShell` redirects learners without a gender to `/choose-gender`; new pages `/discussions`, `/discussions/[id]`, `/admin/discussions`, `/admin/audit`.
