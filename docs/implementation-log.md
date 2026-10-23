# Implementation log

## What exists (2026-10-21)
- **Backend:** Spring Boot 3.2.5 / Java 21 / MySQL 8 / Flyway V1–V5. Modules: identity, courses, progress, questions (Discussion), discussions (rooms), assessments, resources, files, audit, admin.
- **Frontend:** Next.js 14 (App Router, Tailwind, TanStack Query). Public landing (animated hero, mosque illustration), catalogue, auth, learner dashboard, lesson page with **Discussion** section, quizzes and results, Questions page, discussion rooms, notes library, profile (theme, language, password, read-only gender), and the full admin area (courses, lessons, quiz builder + grading, question inbox, notes, discussion rooms, learners, audit log, file uploads).
- **Features added after the first release:** five colour themes; 14 languages with RTL; gender selection and strict gender separation of questions and rooms; comment-style Discussion with replies, likes/dislikes, edit and delete; administrator file uploads (lesson resources, note attachments, course covers); admin audit log; Docker (single image and compose) and Dokploy deployment files.

## Decisions
- Questions are shared inside a gender group (replaces the original "private to learner and admin"); peers can reply, not only the teacher.
- JWT in an HttpOnly SameSite=Lax cookie; Next.js proxies `/api`, so the cookie is same-origin. Lessons need sign-in; catalogue and course pages are public.
- Gender is stored once, not updatable; the gate filter blocks gender-less learners at the API.
- Uploads on disk (volume), not in MySQL; images public, other files require sign-in.
- Quiz edits with attempts create a new version. Progress counts only published lessons.
- Translations use English text as the key with per-language dictionaries; native-speaker review is pending.

## Verification performed
- Backend: unit tests (scoring, progress, video allowlist) and compile pass; the API was run against MySQL 8.4 and exercised with scripted requests for: login/registration, gender gate and immutability, questions/replies/reactions/edits across a male, a female, a legacy and an admin account (other group → 404), discussion rooms, file upload rules (type, content check, access), audit log, quiz scoring and grading.
- Frontend: `tsc --noEmit` clean; production build passed earlier in the project (later builds could not fetch Google Fonts while offline); the register, lesson Discussion, file upload and gender flows were driven in a real Chrome (DevTools protocol) session; all pages return 200 in the dev server.
- Deployment: `docker compose config` validates and the backend jar builds; the Docker images have not been built here (no Docker permission), the first Dokploy build is the real test.

## Known gaps
1. Password-reset emails are only logged; no email provider.
2. No automated integration, security or end-to-end test suites yet (spec §14); no manual accessibility or device testing.
3. In-memory rate limiter and no session revocation / refresh tokens.
4. The notification bell is a placeholder; admin reports are counts only; uploads are never garbage-collected when a resource is removed.
5. Translations are unreviewed; admin-entered content is not translatable; Qur'an/hadith renderings stay English.
6. Theme and language are per browser, not stored on the account.
7. `infra/dev-mysql.sh` keeps its data in `/tmp`.
8. Cover images and Arabic quotations should be reviewed for licensing and accuracy.
