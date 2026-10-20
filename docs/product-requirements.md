# Product requirements

**Tareeq Ul Noor** — *Learn · Reflect · Grow.* A responsive Islamic learning platform for the general public: structured courses, embedded video lessons, progress tracking, lesson-specific questions, quizzes, and notes/benefits. One administrator manages everything in the MVP.

## Principles
- Open to anyone; not tied to one academy or cohort.
- Make the next action obvious: continue a course, finish a lesson, ask a question, take a quiz.
- Keep notes, benefits, questions and quizzes attached to their lesson.
- Mobile-first, spacious on desktop.
- Focused MVP: no payments, certificates, public discussion or microservices.

## Roles
**Learner** — browse published courses; register/sign in; watch lessons and mark them complete; submit private lesson questions and read replies; take quizzes and see history; read notes and benefits.

**Administrator (exactly one in MVP)** — create/edit/reorder/publish/archive courses and lessons; add YouTube URLs, summaries, notes, benefits, resources; build quizzes (MCQ, short answer, essay); answer and moderate questions; grade written answers; manage learner accounts; view basic reports. Role-based authorization is used even though there is one admin. The admin is created by a one-time setup from environment variables; there is no public admin registration.

## Screens (design reference)
1. Landing — hero, "Start Learning"/"Explore Courses", benefits row, featured courses, Qur'anic footer. No fabricated statistics.
2. Learner dashboard — greeting, progress, summary cards, Continue Learning, My Courses, activity, latest notes, recent questions.
3. Lesson — ordered lesson list, embedded video, Mark as Complete, tabs (Notes, Benefits, Resources, Questions, Quiz), previous/next.
4. Quiz — question progress, MCQ and written answers, overview, confirmation before submit; results with score and review.
5. Questions & Answers — private list with course/lesson context, status (Pending/Answered/Resolved), replies.
6. Mobile — compact dashboard with bottom navigation.

## Business rules
- **Course progress** = completed published lessons ÷ published lessons × 100. No published lessons → 0% and a "not ready" message.
- **Completion** is an explicit action (video playback can't prove viewing) and can be undone.
- **Questions** belong to a learner and a lesson. Statuses: SUBMITTED (shown "Pending"), ANSWERED, RESOLVED, HIDDEN. Private between learner and admin.
- **MCQ scoring** happens on the server; correct answers are never sent before submission.
- **Written answers** are "awaiting review" until graded; provisional scores are clearly marked as not final.
- **Percentage** = points awarded ÷ points possible × 100; possible points must be > 0; resubmitting an attempt does not re-award.
- **Quiz changes** never rewrite history: editing a quiz that has attempts creates a new version.
- **Publication:** only published content is public; archiving never deletes progress or results.
- **Privacy:** learners can only read/change their own questions, progress and attempts.

## Acceptance criteria
- Anyone can browse published courses without signing in; an account is needed to save progress, ask questions and take quizzes.
- A learner can open a lesson, watch the embedded video and mark it complete.
- Dashboard progress matches backend data.
- Learners can submit lesson questions and see their statuses and replies.
- The administrator can manage courses, lessons, quizzes, notes and replies.
- MCQs are scored server-side; written answers show "awaiting review" until graded.
- Notes and benefits show under the right lesson and in the notes library.
- Learners cannot reach admin actions or other learners' records.
- Main journeys work on mobile with empty, loading, validation, success and error states.

## Out of scope (later)
Certificates, badges, public discussion, multiple teachers, payments, advanced analytics, video hosting.

## Gender-based separation (added)
- Learners choose **Male or Female** at registration (existing accounts without one are sent to a one-time selection screen before anything else). It is stored permanently and cannot be changed by the user in the profile or through any API; it is shown read-only in the profile.
- **Questions** are visible only to learners of the same gender group (plus the administrator). This replaces the earlier rule that questions were private to the individual learner: people in the same group can now see each other's questions and the teacher's replies; the other group cannot, by list, search, direct link or API (other group's items answer 404).
- **Discussion rooms** are created per gender group. Learners only see, search, post and reply in rooms of their own group.
- The **administrator** can see and manage both groups (users, questions, replies, rooms, posts). Every state-changing admin request is written to an audit log.
