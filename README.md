# Tareeq Ul Noor — Learn · Reflect · Grow

```
backend/   Spring Boot 3 (Java 21) modular monolith · MySQL 8 · Flyway
frontend/  Next.js 14 (App Router) · TypeScript · Tailwind · TanStack Query
infra/     MySQL scripts (schema.sql, dev-mysql.sh)
docs/      requirements, architecture, API, database, design system, i18n, deployment
Dockerfile · docker-compose.yml · .env.example   deployment (Dokploy-ready)
```

Features: courses and lessons with YouTube video, progress, quizzes with server-side scoring, notes and downloadable files, a comment-style lesson **Discussion**, **gender-separated** questions and discussion rooms, five colour themes, 14 languages (Arabic/Urdu RTL), and an admin area with file uploads and an audit log. See `docs/README.md`.

## Quick start without a MySQL password
```
./infra/dev-mysql.sh        # private MySQL on port 3307, creates the schema (no sudo, no root password)
cd backend && ./run-dev.sh  # API on :8080 with demo data and accounts
cd frontend && npm run dev  # web on :3000
```
(After a reboot, run the first command again — its data lives in /tmp.)

## Run locally

1. **MySQL** — `mysql -u root -p < infra/schema.sql` (creates the database, the `ilmpath` user and all tables; edit the password first) or `docker compose -f infra/docker-compose.yml up -d`.
2. **API** (port 8080) — set the variables from `backend/.env.example`, then:
   ```
   cd backend
   export DB_USERNAME=ilmpath DB_PASSWORD=... JWT_SECRET=... \
          ILMPATH_ADMIN_EMAIL=you@example.com ILMPATH_ADMIN_PASSWORD=... ILMPATH_SEED_DEMO=true
   mvn spring-boot:run
   ```
   Flyway creates the schema on first start; the single administrator is created from `ILMPATH_ADMIN_*` if none exists. API docs: http://localhost:8080/swagger-ui.html
3. **Web** (port 3000):
   ```
   cd frontend && npm install && npm run dev
   ```
   `/api/*` is proxied to the API (`API_URL`, default `http://localhost:8080`), so the HttpOnly auth cookie stays same-origin.

### Demo accounts (created by `ILMPATH_SEED_DEMO=true`; local use only)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@ilmpath.test` | `Admin@12345` |
| Learner (male) | `learner@ilmpath.test` | `Learner@12345` |
| Learner (female) | `learner.female@ilmpath.test` | `Learner@12345` |

`backend/run-dev.sh` sets these for you (just set `DB_PASSWORD` first). Never use these in production.

Sign in as the admin at `/login` → `/admin`. Add YouTube URLs to lessons there (demo content has none).

## Deployment
See `docs/deployment-runbook.md` (Dokploy: Compose app with `docker-compose.yml`, or a single-container app with the root `Dockerfile`; both need a persistent volume at `/data/uploads`).

## Notes
- Quiz scoring, progress, publication rules and authorization are enforced in the backend; MCQ answer keys are never sent before submission.
- Editing a quiz that already has attempts creates a new version; old attempts keep their original questions.
- Password-reset links are written to the API log until an email provider is configured.
- Set `COOKIE_SECURE=true` behind HTTPS.
- Learners choose Male/Female once; it cannot be changed, and questions and discussion rooms are separated by it in the backend.
