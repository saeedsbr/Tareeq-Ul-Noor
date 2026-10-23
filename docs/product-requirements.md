# Product requirements

**Tareeq Ul Noor** (طريق النور, "the path of light") — *Learn · Reflect · Grow.* A responsive Islamic learning platform for the general public: structured courses, embedded video lessons, progress tracking, lesson discussions, quizzes, notes/benefits and downloadable resources. One administrator manages the platform.

## Principles
- Open to anyone; free; browsing needs no account.
- Make the next action obvious: continue a course, finish a lesson, ask, take a quiz.
- Keep notes, benefits, files, discussion and quizzes attached to their lesson.
- Mobile-first, spacious on desktop, usable in 14 languages (Arabic and Urdu right-to-left).
- Keep the first release focused: no payments, certificates or microservices.

## Roles
**Learner** — browse courses; register with a gender (Male/Female); watch lessons and mark them complete; take part in the lesson Discussion and gender-specific discussion rooms; take quizzes; read notes, benefits and files; choose a colour theme and language.

**Administrator (one account)** — create/edit/reorder/publish/archive courses and lessons; add YouTube URLs; **upload files from their device** (PDF, images, Office files, audio/video) as lesson resources, note attachments and course covers; build quizzes (MCQ, short answer, essay) and grade written answers; answer and moderate questions; run discussion rooms for both gender groups; manage learner accounts; read the audit log. Created by a one-time setup from environment variables; there is no public admin registration.

## Screens
Landing (hero with mosque illustration, benefits, featured courses, how it works, FAQ) · learner dashboard · course page · lesson page (video, Notes/Benefits/Resources/Quiz tabs, **Discussion** section underneath) · quiz and results · Questions (mine / my group's, with search) · Discussions (rooms) · notes library · profile (read-only gender, theme, language, password) · admin overview, courses, lessons, quizzes (+ list of every learner attempt with review and grading), question inbox, notes, discussions, learners, audit log.

## Business rules
- **Course progress** = completed published lessons ÷ published lessons × 100; no published lessons → 0%.
- **Completion** is an explicit, reversible action (watching a video proves nothing).
- **MCQ scoring** happens on the server; answer keys are never sent before submission. Written answers show "awaiting review" until graded. Percentage = points awarded ÷ points possible × 100; a second submit does not re-score.
- **Quiz changes** never rewrite history: editing a quiz that already has attempts creates a new version.
- **Publication:** only published content is public; archiving never deletes progress or results.
- **Files:** only the administrator uploads; allowlisted types, 25 MB maximum; images (covers) are public, all other files need a signed-in account.

## Gender separation (permanent)
- Every learner chooses **Male or Female** at registration (existing accounts without one get a one-time selection screen before anything else). It is stored permanently, shown read-only in the profile and **cannot be changed by the user, through any screen or API**.
- **Questions / lesson Discussion:** visible only to learners of the same gender group (plus the administrator). Within the group, learners and the teacher can comment, reply, like/dislike, edit and delete their own items. The other group's content is absent from lists, search and answers 404 on direct links or API calls.
- **Discussion rooms** exist per gender group; learners only see, search, post and reply in their own group's rooms.
- Enforced in the Spring Boot backend (see architecture.md), not just the UI. The administrator sees and moderates both groups; every state-changing admin request is logged.
- Names between learners are shown as first names only.

## Acceptance criteria
1. Anyone can browse published courses without an account; an account is needed for progress, discussion and quizzes.
2. A learner can open a lesson, watch the embedded video, mark it complete, and see progress on the dashboard.
3. Every learner account has a permanently stored gender; the other group's questions, comments and rooms are unreachable (UI, API, search, direct link).
4. MCQs are scored server-side; written answers are clearly pending until graded.
5. The administrator can manage all content, upload files from their device, answer questions, moderate rooms and read the audit log.
6. Learners cannot reach admin actions or other learners' private data.
7. The main journeys work on mobile with loading, empty, validation, success and error states, in any of the 14 languages.

## Out of scope (later)
Certificates, badges, multiple teachers, payments, email delivery (reset links are logged), advanced analytics, video hosting.
