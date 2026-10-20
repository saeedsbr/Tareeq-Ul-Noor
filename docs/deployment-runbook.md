# Deployment & setup runbook

## Prerequisites
Java 21, Maven 3.9, Node 20+, MySQL 8.x.

## 1. Database
```
mysql -u root -p < infra/mysql-setup.sql     # edit the password first
```
or `docker compose -f infra/docker-compose.yml up -d` (user/password `ilmpath`, dev only). Flyway creates all tables on first API start.

## 2. API configuration (environment variables)
| Variable | Purpose | Default |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection | localhost / `ilmpath` / `ilmpath` |
| `JWT_SECRET` | ≥32 chars; **must be changed** | insecure dev value |
| `COOKIE_SECURE` | `true` behind HTTPS | `false` |
| `CORS_ORIGIN` | web origin | `http://localhost:3000` |
| `ILMPATH_ADMIN_EMAIL/PASSWORD/NAME` | one-time creation of the single admin if none exists | empty (warning logged) |
| `ILMPATH_SEED_DEMO` | dev sample content | `false` |

```
cd backend && mvn spring-boot:run          # or: mvn package && java -jar target/ilmpath-api-0.1.0.jar
```
After the admin exists, remove `ILMPATH_ADMIN_PASSWORD` from the environment.

## 3. Web
```
cd frontend && npm install
API_URL=http://localhost:8080 npm run dev          # development
npm run build && API_URL=https://api.internal npm start   # production
```
Terminate TLS in front of the web app (reverse proxy). Both services should be served from the same site so the cookie is first-party.

## 4. Production checklist
- HTTPS everywhere; `COOKIE_SECURE=true`; strong `JWT_SECRET` from a secret store.
- Least-privilege MySQL user; no public MySQL port.
- Scheduled `mysqldump` backups, and a tested restore.
- Configure an email provider and replace the logged reset link (see implementation log).
- If running more than one API instance, replace the in-memory rate limiter with a shared store.
- Monitor `/actuator/health`; collect structured logs; keep dependencies updated.

## Tests
`cd backend && mvn test` (unit tests: scoring, progress, video allowlist). `cd frontend && npm run lint` (type-check) and `npm run build`.

## Dokploy (Docker Compose)
Files: `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.env.example`.
1. Create the MySQL 8 database (any MySQL server works; the user needs full rights on its schema so Flyway can create tables).
2. In Dokploy create a **Compose** application from this GitHub repository (branch `main`, compose path `./docker-compose.yml`).
3. Paste the variables from `.env.example` into the **Environment** tab and fill them in (DB_URL host/name, DB_USERNAME, DB_PASSWORD, JWT_SECRET, CORS_ORIGIN = your https URL, admin email/password).
4. **Domains** tab: add your domain, service `tun-web`, port `3000`, HTTPS on. Do not expose `tun-api`; the website proxies `/api` to it internally.
5. Deploy. Check `tun-api` logs for "Started IlmPathApplication", then open the domain and sign in as the admin.
Notes: the API reads the real visitor IP from `X-Forwarded-For` (rate limits are per visitor). `ILMPATH_ADMIN_PASSWORD` is only used the first time (when no admin exists); remove it afterwards. Keep `ILMPATH_SEED_DEMO=false` in production. If the database is a Dokploy service on `dokploy-network`, use its internal hostname in `DB_URL`.
