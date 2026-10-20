# Implementation log

## What was built
- **Repository layout:** `backend/` and `frontend/` kept separate as requested, plus `infra/` and `docs/`.
- **Database:** MySQL (per request) with a Flyway V1 migration covering all spec tables plus password-reset tokens.
- **Backend:** Spring Boot 3.2.5 / Java 21 — identity, courses/lessons, progress/dashboard, questions, assessments with server-side scoring and manual grading, notes/benefits, admin APIs, OpenAPI, rate limiting, YouTube allowlist, admin and demo seeders. Version 3.2.5 was chosen because its libraries were already in the local Maven cache.
- **Frontend:** Next.js 14 App Router with the six reference screens (landing, dashboard, lesson, quiz + results, Q&A, mobile layout) and auth pages, catalogue, course detail, notes library, and a full admin area (courses, lessons incl. reordering/resources, quiz builder, question inbox, notes, learners, grading).
- **Tests:** unit tests for percentage calculation, course progress and the video allowlist.

## Verification performed
- `mvn compile` and `mvn test` pass.
- `tsc --noEmit` and `next build` pass (22 routes).
- The frontend dev server starts and serves `/` (HTTP 200).

## Not yet verified
- Verified against MySQL 8.4: API starts, Flyway/JPA validation passes, login, dashboard, completion, questions and the quiz (MCQ scoring, pending written answer, idempotent submit) work through the web proxy; learners get 403 on admin routes.
- No Spring integration/security tests, frontend tests or end-to-end tests exist yet (spec §14).
- No manual responsive/accessibility testing on real devices.

## Decisions
- JWT in an HttpOnly SameSite=Lax cookie; Next.js proxies `/api` so the cookie is same-origin.
- Lessons require sign-in; the catalogue and course pages are public.
- Quiz editing with existing attempts creates a new version.
- Question statuses map SUBMITTED → "Pending" in the UI.
- Progress counts only published lessons; "enrolled" means the learner has completed at least one lesson in the course.
- Quiz timer in the UI is an elapsed-time display only; there is no server-enforced time limit.

## Known gaps / next steps
1. Run against MySQL and fix anything the first startup reveals.
2. Email delivery for password reset (currently logged).
3. Integration tests (auth, ownership, admin-only access) and Playwright journey test.
4. Quiz "Submit" confirms but does not block navigation away mid-attempt.
5. Notification bell is a placeholder; global header search appears on public pages only.
6. Admin overview is counts only (no charts or per-learner progress report).
7. In-memory rate limiter and no refresh-token/session revocation.
8. Cover images and the Arabic quotations should be reviewed by the content owner for licensing and accuracy.

## Profile, themes and languages (added later)
- `/profile` for learners and admin: name, password change (`PUT /api/v1/me/password`), colour theme (5 themes via CSS variables in `globals.css`), and language.
- Languages (`frontend/src/lib/i18n/`): English, Arabic, Urdu, Dutch, German, French, Spanish, Turkish, Indonesian, Malay, Bengali, Hindi, Portuguese, Russian. Arabic and Urdu switch the page to right-to-left. Theme and language are stored in the browser (localStorage), not on the account.
- Translated so far: header/sidebar/mobile navigation, landing hero, feature cards, headings and call to action, sign-in and register pages, learner dashboard, profile page. Everything else (lessons, quizzes, questions, notes, admin pages, FAQ and long landing paragraphs) is still English. To translate more, add keys to `en.ts` and every language file (TypeScript enforces that no language is missing a key), then use `t('key')`.
- Translations were written by the assistant and have not been reviewed by native speakers.

### Language coverage update
All user-facing text now goes through `t()` (`frontend/src/lib/i18n*`): navigation, landing page, auth, learner pages (dashboard, course, lesson, quiz, results, questions, notes), profile and every admin page. Old-style keys (`nav.home`) and English-as-key strings (`t("Mark as Complete")`) both work; English text is the fallback. Relative times use the browser's `Intl.RelativeTimeFormat`. Not translated: course/lesson/quiz/note content entered by the admin, learner-submitted text, the Qur'an and hadith English renderings, and error messages produced by the API that are not in the dictionary. Translations are the assistant's and need native-speaker review.

## Gender separation (added)
Implemented per the requirement: registration/first-login gender selection, permanent storage, read-only display, gender-scoped questions, gender-specific discussion rooms, backend enforcement (filter + query-level scoping), admin access to both groups, audit log. Verified through the API with a male, a female, a legacy account without gender and the administrator: the other group's questions/rooms are absent from lists and search and answer 404 on direct access, posting into the other group's room is 404, gender cannot be changed (409) and the gate blocks gender-less learners (403 GENDER_REQUIRED). UI pages were compiled but not clicked through in a browser. Demo accounts now include `learner.female@ilmpath.test`.
Decision to confirm: questions are now visible to the whole same-gender group (not only the asker and teacher), because the requirement says male users see male users' questions. Replies to questions are still written by the administrator only; peer conversation happens in discussion rooms.
