# Architecture

```
Browser ──HTTPS──▶ Traefik (Dokploy) ──▶ Next.js 14  (port 3000)
                                              │  /api/* rewritten to the API (same origin → HttpOnly cookie)
                                              ▼
                                   Spring Boot 3.2 / Java 21 (port 8080, internal only)
                                              │ JPA + Flyway          │ files on disk (UPLOAD_DIR)
                                              ▼
                                           MySQL 8
```
The frontend collects input and displays data. The backend is authoritative for permissions, gender scoping, progress, scoring, publication status and validation.

## Repository
`backend/` Spring Boot API (`com.ilmpath.*`) · `frontend/` Next.js app · `infra/` MySQL scripts (`schema.sql`, `dev-mysql.sh`, compose for MySQL only) · `docs/` · root `Dockerfile` (single image), `docker-compose.yml` (two services), `docker/start.sh`.

## Backend modules (`backend/src/main/java/com/ilmpath`)
| Package | Responsibility |
|---|---|
| `identity` | users, roles, gender, registration/login/password reset, JWT cookie filter, `GenderGateFilter`, `GenderScope`, security config, admin and demo seeders |
| `courses` | courses, lessons, resources; public catalogue and lesson player data |
| `progress` | completions, progress calculation, learner dashboard |
| `questions` | lesson Discussion: comments, replies, reactions, edits, gender-scoped queries |
| `discussions` | gender-specific rooms and posts (+ admin moderation) |
| `assessments` | quizzes, versions, attempts, scoring, grading |
| `resources` | notes and benefits (with optional attachment) |
| `files` | administrator uploads and downloads |
| `audit` | admin audit log (interceptor + endpoint) |
| `admin` | admin-only controllers (content, assessments, community/users/reports) |
| `common` | `ApiException`, global error handler, `RateLimiter`, YouTube allowlist, slugs |

DTOs are records; entities are never returned directly.

## Security model
- **Auth:** BCrypt (cost 12); JWT (HS256) in a `HttpOnly`, `SameSite=Lax` cookie `ilm_token` (`Secure` when `COOKIE_SECURE=true`); CSRF is disabled on purpose (stateless, JSON-only, SameSite cookie).
- **Routes:** `/api/v1/auth/**`, `GET /courses/**`, `GET /files/**` are public (non-image files then require sign-in in the controller); `/api/v1/admin/**` needs `ROLE_ADMIN`; everything else needs sign-in. Ownership checks are in code.
- **Gender gate:** `GenderGateFilter` (inside the security chain) answers `403 GENDER_REQUIRED` to learners without a gender on every API except `GET /me`, `PUT /me/gender`, auth and the public catalogue.
- **Gender immutability:** `User.gender` is `@Column(updatable=false)`; the only write after registration is `UserRepository.setGenderOnce` (`UPDATE … WHERE gender IS NULL`) → a second attempt returns 409. (No DB trigger: MySQL needs extra privileges for triggers when binary logging is on.)
- **Gender scoping:** `GenderScope.restrictedTo(user)` decides the visible group (learner → own, admin → all). Questions are filtered inside repository queries (`userId in (select id from User where gender = :g)`); rooms are always loaded together with the caller's gender, so the other group's resources return 404. Reactions and replies re-check visibility.
- **Rate limits** (in-memory, per client IP / user): login, registration, password reset, questions, replies, reactions, posts. `server.forward-headers-strategy=native` makes the limiter see the real visitor IP behind Traefik/Next.
- **Videos:** only YouTube URLs, stored as `youtube-nocookie.com/embed/<id>`.
- **Uploads:** extension allowlist + magic-byte check, random stored names, `nosniff`, restrictive CSP on non-PDF, images public / other files authenticated; SVG/HTML are rejected.
- **Audit:** `AdminAuditInterceptor` records every non-GET request to `/api/v1/admin/**` (admin, route pattern, path, status). Request bodies are not stored.

## Quiz lifecycle
Start/resume attempt → autosave answers → submit (idempotent; MCQs scored, written answers pending → `AWAITING_REVIEW` or `GRADED`) → admin grades written answers → status/`passed` updated. Editing a quiz with attempts archives it and creates `version + 1`.

## Frontend (`frontend/src`)
- `app/` routes: public (`/`, `/courses`, auth pages), `(app)/` learner pages inside `AppShell`, `admin/` pages inside `AppShell admin`, `/profile`, `/choose-gender`. `middleware.ts` sends signed-in visitors from `/`, `/login`, `/register` to their dashboard.
- `components/`: `AppShell` (sidebar, mobile bottom nav, gender redirect), `LessonComments` (Discussion section), `FileUpload`, `Modal`, `ui` (progress, badges, states), `LandingView`, `MosqueScene`, `HeroBackground`, `Reveal`, `GenderPicker`.
- `lib/`: typed API client, auth hooks, theme (CSS variables, five palettes), i18n (14 languages), `hydrated.ts` (submit buttons stay disabled until React is ready, so an early click can never fall back to a native form submit).
- Forms: React Hook Form + Zod; data: TanStack Query. `next.config.mjs` rewrites `/api/*` to `API_URL` and builds a `standalone` server.
