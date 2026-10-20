# REST API (as implemented)

Base path `/api/v1`. JSON only. Interactive docs: `/swagger-ui.html`, spec at `/v3/api-docs`. Auth is the `ilm_token` HttpOnly cookie (or `Authorization: Bearer`).

**Errors:** `{ "timestamp", "status", "message", "fields"? }` — 400 validation (`fields` maps field → message), 401 not signed in, 403 forbidden, 404 not found, 409 conflict, 429 rate-limited, 500 generic (details only in server log).

## Auth (public)
| Method & path | Notes |
|---|---|
| `POST /auth/register` | `{name,email,password(8–72)}` → user; signs in |
| `POST /auth/login` | `{email,password}` → user |
| `POST /auth/logout` | clears cookie, 204 |
| `POST /auth/forgot-password` | always 202 (does not reveal whether the email exists); link logged on server |
| `POST /auth/reset-password` | `{token,password}` |
| `GET /me`, `PATCH /me` | current user; update name |

## Catalogue
| `GET /courses?q=` | published courses with lesson count; progress fields when signed in |
|---|---|
| `GET /courses/{slug}` | course, published lessons, `continueLessonId`, per-lesson `completed` |

## Learning (signed in)
| Method & path | Notes |
|---|---|
| `GET /lessons/{id}` | lesson, embed URL, sibling lessons, prev/next, notes, benefits, resources, quiz id, counts |
| `PUT /lessons/{id}/completion` | mark complete (idempotent) |
| `DELETE /lessons/{id}/completion` | undo |
| `GET /me/progress` | dashboard: stats, overall %, continue-learning, courses, activity, latest notes, recent questions |
| `GET /me/courses` | courses the learner has started |
| `GET /notes` | published notes and benefits library |

## Questions (signed in, own data only)
`POST /lessons/{id}/questions {body 5–2000}` · `GET /lessons/{id}/questions` · `GET /me/questions` · `GET /questions/{id}` · `PATCH /questions/{id}/resolve`

## Quizzes (signed in)
| Method & path | Notes |
|---|---|
| `GET /lessons/{lessonId}/quiz`, `GET /quizzes/{id}` | questions and options **without** correct flags; own attempt history |
| `POST /quizzes/{id}/attempts` | start or resume; returns saved answers |
| `PUT /attempts/{id}/answers` | `{answers:[{questionId,optionId?,text?}]}`, 204 |
| `POST /attempts/{id}/submit` | scores; idempotent |
| `GET /attempts/{id}/result` | score, status (`AWAITING_REVIEW`/`GRADED`), per-question review incl. correct options |

## Admin (`ROLE_ADMIN` only)
| Area | Endpoints |
|---|---|
| Courses | `GET/POST /admin/courses`, `PUT /admin/courses/{id}`, `DELETE` = archive |
| Lessons | `GET /admin/lessons[?courseId]`, `GET/PUT/DELETE /admin/lessons/{id}`, `POST /admin/lessons`, `PUT /admin/courses/{id}/lessons/order` (array of ids) |
| Notes | `GET/POST /admin/notes`, `PUT/DELETE /admin/notes/{id}` |
| Quizzes | `GET/POST /admin/quizzes`, `GET/PUT/DELETE /admin/quizzes/{id}` (versioning on edit) |
| Grading | `GET /admin/attempts/pending`, `GET /admin/attempts/{id}`, `PATCH /admin/answers/{id}/grade {points,feedback}` |
| Questions | `GET /admin/questions[?status]`, `POST /admin/questions/{id}/replies`, `PATCH /admin/questions/{id}/status` |
| Users | `GET /admin/users`, `PATCH /admin/users/{id}/status` (the admin account can't be suspended) |
| Reports | `GET /admin/reports/overview` |

Health: `GET /actuator/health` (public); other Actuator endpoints are not exposed.

## Gender separation (added)
| Method & path | Notes |
|---|---|
| `POST /auth/register` | now requires `gender` (`MALE`/`FEMALE`) |
| `PUT /me/gender` | one-time selection for accounts without a gender; 409 if already set |
| `GET /me` | includes `gender` |
| `GET /community/questions?q=` | questions from the caller's gender group only (learners) |
| `GET /lessons/{id}/questions` | the group's questions for that lesson (administrator: all) |
| `GET /questions/{id}` | 404 unless the asker is in the caller's group |
| `GET /rooms`, `GET /rooms/{id}`, `GET /rooms/{id}/posts?q=`, `POST /rooms/{id}/posts`, `DELETE /rooms/{roomId}/posts/{postId}` | learner discussion rooms, own group only |
| `GET/POST /admin/rooms`, `PUT /admin/rooms/{id}`, `GET/POST /admin/rooms/{id}/posts`, `PATCH /admin/posts/{id}/status` | administrator, both groups |
| `GET /admin/audit-log?limit=` | recent admin actions |

Learners without a gender receive `403 {"code":"GENDER_REQUIRED"}` everywhere except the endpoints listed in architecture.md.

## File uploads (added)
`POST /admin/files` (multipart field `file`, administrator only, max 25 MB) → `{id, name, url, contentType, size}`; allowed: PDF, PNG/JPG/WEBP/GIF, TXT, DOC(X), PPT(X), XLS(X), MP3, M4A, MP4 (extension allowlist plus content check). `GET /files/{id}`: images are public (course covers), every other file requires sign-in. Lesson resources use `type: "FILE"` with `contentOrUrl` = `/api/v1/files/{id}`; notes/benefits have `attachmentName` / `attachmentUrl`.
