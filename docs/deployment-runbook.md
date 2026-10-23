# Deployment and operations

## Prerequisites
Java 21 and Maven 3.9 (API), Node 20+ (web), MySQL 8.x. Docker for the container setups.

## Environment variables (API)
| Variable | Purpose | Default |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection (user needs full rights on its database so Flyway can migrate) | localhost / `ilmpath` / `ilmpath` |
| `JWT_SECRET` | ≥ 32 characters; **must be changed** | insecure dev value |
| `COOKIE_SECURE` | `true` behind HTTPS | `false` |
| `CORS_ORIGIN` | public site URL | `http://localhost:3000` |
| `ILMPATH_ADMIN_EMAIL`, `ILMPATH_ADMIN_PASSWORD`, `ILMPATH_ADMIN_NAME` | creates the single administrator at startup **only if none exists** | empty (warning logged) |
| `ILMPATH_SEED_DEMO` | sample courses and demo accounts (development only) | `false` |
| `UPLOAD_DIR` | where administrator uploads are stored | `./uploads` (`/data/uploads` in the images) |
Web: `API_URL` (address of the API; default `http://localhost:8080`; baked into the build for the `/api` rewrite).

## Local development
```
./infra/dev-mysql.sh               # private MySQL on :3307 (no sudo/root password); data in /tmp, recreated after reboot
cd backend && ./run-dev.sh         # API on :8080, demo data and accounts (set DB_URL/DB_PASSWORD for another database)
cd frontend && npm install && npm run dev
```
Alternatively create the database with `infra/schema.sql` (V1–V5, creates the `ilmpath` user — edit its password first) or let Flyway create the tables on first start. Demo accounts (development only): `admin@ilmpath.test` / `Admin@12345`, `learner@ilmpath.test` and `learner.female@ilmpath.test` / `Learner@12345`.
Tests: `cd backend && mvn test`; `cd frontend && npm run lint` (type-check) and `npm run build` (needs internet for Google Fonts).

## Docker
- `docker-compose.yml` — two services: `tun-api` (backend image, health check on `/actuator/health`) and `tun-web` (standalone Next.js server). No database service: MySQL is external. A named volume `uploads` is mounted at `/data/uploads`. Names are prefixed `tun-` because `dokploy-network` is shared with other apps.
- Root `Dockerfile` — one image that runs the API and the website together (`docker/start.sh`; the container stops if either process stops). Public port 3000, API on 8080 inside only.
- `backend/Dockerfile`, `frontend/Dockerfile` — per-service images used by the compose file.
- `.env.example` lists the variables to fill in. Never commit real values.

## Dokploy
**Recommended: Compose application.** Create it from the GitHub repository (branch `main`, compose path `./docker-compose.yml`), paste the environment, add the domain for service **`tun-web`**, port **3000**, HTTPS on, deploy. You get two containers with separate logs.
**Alternative: Dockerfile application** (single container): build type Dockerfile, path `./Dockerfile`, context `.`, domain port 3000. Add a **Volume Mount** at `/data/uploads`, otherwise uploaded files are lost on every redeploy.
Database: use the database service's **internal** host name in `DB_URL`; a `$` in a password must be written `$$` in Dokploy environment values.

### First administrator
The first successful start creates the admin from `ILMPATH_ADMIN_EMAIL`/`ILMPATH_ADMIN_PASSWORD`. If the API could not start before that (for example a wrong database password), no admin exists yet — fix the variables and redeploy. Afterwards remove `ILMPATH_ADMIN_PASSWORD` from the environment and change the password under Profile. An admin can also be inserted directly into `users` (BCrypt hash, role `ADMIN`).

### Troubleshooting
- *Bad Gateway* → the container is crashing or the domain port is wrong. Read `tun-api` logs: `Access denied for user…` means wrong database credentials or a user not allowed from other hosts (`CREATE USER 'u'@'%'`).
- Sign-in says "Invalid email or password" on the live site → the demo accounts do not exist there (seed is off); use the administrator you configured.
- Registration button ignores clicks for a moment on slow loads → by design (it waits for the page to be interactive).

## Uploaded files and backups
Uploads live in `UPLOAD_DIR` (not in MySQL). Back up that folder together with `mysqldump`, and test a restore. Rate limiting is in-memory (per instance); use a shared store if you ever run more than one API instance.

## Production checklist
HTTPS, `COOKIE_SECURE=true`, strong `JWT_SECRET` from a secret store, least-privilege database user, no public MySQL port, scheduled backups (database + uploads), an email provider for password reset (links are only logged today), `/actuator/health` monitoring, dependencies kept up to date, `ILMPATH_SEED_DEMO=false`.
