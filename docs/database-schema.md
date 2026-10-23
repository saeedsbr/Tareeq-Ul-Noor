# Database schema (MySQL 8, InnoDB, utf8mb4)

Managed by Flyway (`backend/src/main/resources/db/migration`). Hibernate runs with `ddl-auto: validate`. Timestamps are `DATETIME(6)` in UTC. Never edit an applied migration — add a new one.

| Migration | Adds |
|---|---|
| V1 `init` | users, password_reset_tokens, courses, lessons, lesson_resources, lesson_completions, questions, question_replies, quizzes, quiz_questions, quiz_options, quiz_attempts, quiz_answers, notes |
| V2 `gender_discussions_audit` | `users.gender`, discussion_rooms, discussion_posts, admin_audit_log; two default rooms |
| V3 `uploaded_files` | uploaded_files; `notes.attachment_name/url` |
| V4 `comment_style_replies` | `question_replies.admin_user_id` → `user_id` (anyone in the group can reply), `status` |
| V5 `comment_reactions_edits` | comment_reactions; `questions.edited_at`, `question_replies.edited_at` |

## Tables
| Table | Key columns / notes |
|---|---|
| `users` | `id` UUID, `name`, `email` unique, `password_hash`, `role` (LEARNER/ADMIN), **`gender` (MALE/FEMALE, CHECK constraint; NULL only until chosen and for the admin)**, `status` (ACTIVE/SUSPENDED) |
| `password_reset_tokens` | SHA-256 `token_hash` unique, `expires_at`, `used` |
| `courses` | `slug` unique, `level`, `cover_image_url`, `status` (DRAFT/PUBLISHED/ARCHIVED), `position` |
| `lessons` | `course_id`, `slug` (unique per course), `video_url` (YouTube embed), `duration_minutes`, `position`, `status` |
| `lesson_resources` | `resource_type` (LINK/PDF/REFERENCE/**FILE**), `content_or_url` (URL, text, or `/api/v1/files/{id}`) |
| `lesson_completions` | unique (`user_id`, `lesson_id`) |
| `questions` | lesson comments: `user_id`, `lesson_id`, `body`, `status` (SUBMITTED/ANSWERED/RESOLVED/HIDDEN), `edited_at` |
| `question_replies` | `question_id`, `user_id` (learner or admin), `body`, `status` (VISIBLE/HIDDEN), `edited_at` |
| `comment_reactions` | unique (`user_id`, `target_type` QUESTION/REPLY, `target_id`), `value` 1 or −1 (CHECK) |
| `quizzes` … `quiz_answers` | quiz definitions with `version`; attempts and answers (`awarded_points` NULL = not graded yet) |
| `notes` | `kind` NOTE/BENEFIT, lesson/course link, `status`, `attachment_name`, `attachment_url` |
| `discussion_rooms` | **`gender` (CHECK), immutable**, `title`, `description`, `status` ACTIVE/ARCHIVED |
| `discussion_posts` | `room_id`, `user_id`, `parent_id` (reply), `body`, `status` VISIBLE/HIDDEN |
| `admin_audit_log` | `admin_user_id`, `action` (method + route), `target` (path), `http_status`, `created_at` |
| `uploaded_files` | `id` UUID, `original_name`, `stored_name` (random), `content_type`, `size_bytes`, `uploaded_by` — the bytes live on disk under `UPLOAD_DIR` |

```
users ─┬─< lesson_completions >─ lessons >─ courses
       ├─< questions >─ lessons ;  questions ─< question_replies >─ users
       │      └─< comment_reactions (QUESTION / REPLY targets)
       ├─< discussion_posts >─ discussion_rooms (gender)
       ├─< quiz_attempts >─ quizzes >─ lessons ;  quiz_attempts ─< quiz_answers >─ quiz_questions ─< quiz_options
       └─< password_reset_tokens, admin_audit_log, uploaded_files
lessons ─< lesson_resources ;  notes >─ lessons / courses
```

## History and privacy rules
- Content is archived (`status = ARCHIVED`), never hard-deleted, so completions and attempts keep valid references. Deleted comments/replies/posts are hidden, not erased.
- A quiz with attempts is never edited in place: saving creates `version + 1` and archives the old row. One `PUBLISHED` quiz per lesson.
- **Gender is not duplicated** onto questions or replies; it is read from `users.gender` inside the queries. Gender is written once (see architecture.md) and never updated.

## Creating the schema without the app
`infra/schema.sql` creates the database, the `ilmpath` user and all 19 tables (V1–V5). The app is configured with Flyway `baseline-on-migrate` at version **5**, so it starts normally on a database built this way; on an empty database Flyway builds the same tables itself.
