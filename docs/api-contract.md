# REST API (as implemented)

Base path `/api/v1`, JSON only (uploads are `multipart/form-data`). Interactive docs: `/swagger-ui.html`. Auth: `ilm_token` HttpOnly cookie (or `Authorization: Bearer`).

**Errors:** `{timestamp, status, message, fields?, code?}` — 400 validation, 401 not signed in, 403 forbidden (`code: "GENDER_REQUIRED"` for learners without a gender), 404 not found *(also used when the resource belongs to the other gender group)*, 409 conflict, 429 rate-limited, 500 generic.

## Auth and profile
`POST /auth/register {name,email,password,gender}` · `POST /auth/login` · `POST /auth/logout` · `POST /auth/forgot-password` · `POST /auth/reset-password` · `GET /me` (includes `gender`) · `PATCH /me {name}` · `PUT /me/password {currentPassword,newPassword}` · `PUT /me/gender {gender}` (once only; 409 if already set).

## Catalogue and learning (signed in unless noted)
`GET /courses?q=` and `GET /courses/{slug}` (public) · `GET /lessons/{id}` · `PUT|DELETE /lessons/{id}/completion` · `GET /me/progress` · `GET /me/courses` · `GET /notes` (notes and benefits, with `attachmentName/Url`).

## Lesson Discussion (same gender group only)
| Endpoint | Notes |
|---|---|
| `GET /lessons/{id}/questions` | the group's comments, newest first, with replies, `likes`, `myReaction`, `mine`, `editedAt` (admin: all) |
| `POST /lessons/{id}/questions {body}` | new comment (5–2000 chars) |
| `PATCH /questions/{id} {body}` · `DELETE /questions/{id}` | own comment only (delete = hide) |
| `POST /questions/{id}/replies {body}` | any learner of the group (admins use the admin route) |
| `PATCH` / `DELETE /questions/{qid}/replies/{rid}` | own reply only |
| `PUT /questions/{id}/reaction`, `PUT /questions/{qid}/replies/{rid}/reaction {value: 1\|-1\|0}` | like / dislike / clear |
| `GET /me/questions` · `GET /community/questions?q=` · `GET /questions/{id}` · `PATCH /questions/{id}/resolve` | the Questions page: mine / my group's (search) / one / mark resolved |

Anything belonging to the other group returns 404.

## Discussion rooms (learners, own group)
`GET /rooms` · `GET /rooms/{id}` · `GET /rooms/{id}/posts?q=` · `POST /rooms/{id}/posts {body,parentId?}` · `DELETE /rooms/{roomId}/posts/{postId}` (own).

## Quizzes
`GET /lessons/{lessonId}/quiz` · `GET /quizzes/{id}` (no answer keys) · `POST /quizzes/{id}/attempts` · `PUT /attempts/{id}/answers` · `POST /attempts/{id}/submit` (idempotent) · `GET /attempts/{id}/result`.

## Files
`GET /files/{id}` — images public, other files need sign-in; PDFs/images inline, others as downloads. Upload is admin-only (below).

## Administrator (`ROLE_ADMIN`; every non-GET call is written to the audit log)
| Area | Endpoints |
|---|---|
| Courses | `GET/POST /admin/courses`, `PUT /admin/courses/{id}`, `DELETE` = archive |
| Lessons | `GET /admin/lessons[?courseId]`, `GET/PUT/DELETE /admin/lessons/{id}`, `POST /admin/lessons`, `PUT /admin/courses/{id}/lessons/order` |
| Notes | `GET/POST /admin/notes`, `PUT/DELETE /admin/notes/{id}` (optional `attachmentName`, `attachmentUrl` = `/api/v1/files/{uuid}`) |
| Files | `POST /admin/files` (field `file`, ≤ 25 MB; PDF, PNG/JPG/WEBP/GIF, TXT, DOC(X), PPT(X), XLS(X), MP3, M4A, MP4) → `{id,name,url,contentType,size}` |
| Quizzes | `GET/POST /admin/quizzes` (list includes archived), `GET/PUT /admin/quizzes/{id}`, `DELETE /admin/quizzes/{id}` = archive, `DELETE /admin/quizzes/{id}?permanent=true[&force=true]` = delete for good (409 if the quiz has learner attempts unless `force=true`, which also deletes those attempts and scores); attempts: `GET /admin/attempts[?quizId&status]` (all submitted attempts with learner, gender, score, status), `GET /admin/attempts/pending`, grading: `GET /admin/attempts/{id}`, `PATCH /admin/answers/{id}/grade` |
| Questions | `GET /admin/questions[?status]`, `POST /admin/questions/{id}/replies`, `PATCH /admin/questions/{id}/status` |
| Rooms | `GET/POST /admin/rooms`, `PUT /admin/rooms/{id}`, `GET/POST /admin/rooms/{id}/posts`, `PATCH /admin/posts/{id}/status` |
| Users and reports | `GET /admin/users` (with gender), `PATCH /admin/users/{id}/status`, `GET /admin/reports/overview`, `GET /admin/audit-log?limit=` |

Health: `GET /actuator/health` (public, used by container health checks).
