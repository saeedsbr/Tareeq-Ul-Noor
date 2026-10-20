# Database schema (MySQL 8, InnoDB, utf8mb4)

Managed by Flyway: `backend/src/main/resources/db/migration/V1__init.sql`. Hibernate runs with `ddl-auto: validate`. Timestamps are `DATETIME(6)` stored in UTC.

| Table | Key columns / notes |
|---|---|
| `users` | `id CHAR(36)` UUID, `name`, `email` unique, `password_hash`, `role` (LEARNER/ADMIN), `status` (ACTIVE/SUSPENDED) |
| `password_reset_tokens` | `user_id` FK, `token_hash` (SHA-256, unique), `expires_at` (1 h), `used` |
| `courses` | `title`, `slug` unique, `description`, `level`, `cover_image_url`, `status` (DRAFT/PUBLISHED/ARCHIVED), `position`, `created_by` |
| `lessons` | `course_id` FK, `title`, `slug` (unique per course), `description`, `video_provider`, `video_url`, `duration_minutes`, `position`, `status`, `published_at` |
| `lesson_resources` | `lesson_id` FK (cascade), `title`, `resource_type`, `content_or_url`, `position` |
| `lesson_completions` | `user_id`, `lesson_id`, `completed_at`; **unique (user_id, lesson_id)** |
| `questions` | `user_id`, `lesson_id`, `body`, `status` (SUBMITTED/ANSWERED/RESOLVED/HIDDEN); indexes on user and status |
| `question_replies` | `question_id` FK (cascade), `admin_user_id` FK, `body`, `created_at` |
| `quizzes` | `lesson_id` FK, `title`, `instructions`, `pass_percentage`, `status`, `version` |
| `quiz_questions` | `quiz_id` FK (cascade), `type` (MCQ/SHORT_ANSWER/ESSAY), `prompt`, `points`, `position`, `model_answer`, `grading_mode` (AUTO/MANUAL) |
| `quiz_options` | `quiz_question_id` FK (cascade), `text`, `is_correct`, `position` — MCQ only |
| `quiz_attempts` | `quiz_id`, `user_id`, `status` (IN_PROGRESS/AWAITING_REVIEW/GRADED), `started_at`, `submitted_at`, `score_awarded`, `score_possible`, `percentage`, `passed` |
| `quiz_answers` | `attempt_id` FK (cascade), `quiz_question_id`, `selected_option_id`, `text_answer`, `awarded_points` (NULL = not yet graded), `feedback`; **unique (attempt_id, quiz_question_id)** |
| `notes` | `course_id`/`lesson_id` nullable, `kind` (NOTE/BENEFIT), `title`, `body`, `status`, `created_by` |

## Notes on deviations from the original entity list
- `kind` was added to `notes` so one table holds both notes and benefits.
- `duration_minutes` and `position` were added to `lessons`/`courses` (ordering and display).
- `password_reset_tokens` supports password recovery.

## History preservation
- Content is archived (`status = ARCHIVED`), never hard-deleted, so completions and attempts keep valid foreign keys.
- A quiz that has attempts is never edited in place; saving creates a new version and archives the old one. Attempts point at the version they were taken on.
- Only one `PUBLISHED` quiz per lesson: publishing a version archives other published versions of that lesson.

## Relationships
```
users ─┬─< lesson_completions >─ lessons >─ courses
       ├─< questions >─ lessons ;  questions ─< question_replies >─ users(admin)
       ├─< quiz_attempts >─ quizzes >─ lessons ;  quiz_attempts ─< quiz_answers >─ quiz_questions ─< quiz_options
       └─< password_reset_tokens
lessons ─< lesson_resources ;  notes >─ lessons / courses ;  quizzes ─< quiz_questions
```

## Creating the schema manually
`infra/schema.sql` creates the database, the `ilmpath` user and all 14 tables in one step (`mysql -u root -p < infra/schema.sql`). Flyway is configured with `baseline-on-migrate` at version 1, so the API starts normally against a database created this way; on an empty database Flyway creates the same tables itself.

## V2 — gender, discussions, audit (added)
- `users.gender VARCHAR(10) NULL` with `CHECK (gender IS NULL OR gender IN ('MALE','FEMALE'))` and an index. NULL is allowed only so existing accounts and the administrator are not broken; learners cannot use the platform until it is set.
- `discussion_rooms` (`gender` NOT NULL with CHECK, `title`, `description`, `status`) and `discussion_posts` (`room_id`, `user_id`, `parent_id`, `body`, `status` VISIBLE/HIDDEN). Two default rooms (brothers, sisters) are inserted by the migration.
- `admin_audit_log` (`admin_user_id`, `action`, `target`, `http_status`, `created_at`).
- Question gender is not duplicated: it is derived from the asker's `users.gender` in queries.
- Immutability is enforced in the application (see architecture.md); no database trigger is used because MySQL requires extra privileges for triggers when binary logging is on.

## V3 — uploaded files (added)
`uploaded_files` (`id` UUID, `original_name`, `stored_name`, `content_type`, `size_bytes`, `uploaded_by`, `created_at`); `notes.attachment_name`, `notes.attachment_url`. File bytes are stored on disk under `UPLOAD_DIR` (default `./uploads`), not in MySQL — in Docker mount a persistent volume at `/data/uploads`.
