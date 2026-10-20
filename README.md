# Tareeq Ul Noor — Learn · Reflect · Grow

```
backend/   Spring Boot 3 (Java 21) modular monolith · MySQL 8 · Flyway
frontend/  Next.js 14 (App Router) · TypeScript · Tailwind · TanStack Query
infra/     MySQL setup SQL and optional docker-compose
```

## Quick start without a MySQL password
```
./infra/dev-mysql.sh        # private MySQL on port 3307, creates the schema (no sudo, no root password)
cd backend && ./run-dev.sh  # API on :8080 with demo data and accounts
cd frontend && npm run dev  # web on :3000
```
(After a reboot, run the first command again — its data lives in /tmp.)

## Run locally

1. **MySQL** — either `mysql -u root -p < infra/mysql-setup.sql` (edit the password first) or `docker compose -f infra/docker-compose.yml up -d`.
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

## Notes
- Quiz scoring, progress, publication rules and authorization are enforced in the backend; MCQ answer keys are never sent before submission.
- Editing a quiz that already has attempts creates a new version; old attempts keep their original questions.
- Password-reset links are written to the API log until an email provider is configured.
- Set `COOKIE_SECURE=true` behind HTTPS.
