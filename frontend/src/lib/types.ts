export type Gender = 'MALE' | 'FEMALE';
export type User = { id: string; name: string; email: string; role: 'LEARNER' | 'ADMIN'; gender?: Gender };
export type CourseCard = { id: number; title: string; slug: string; description: string | null; level: string; coverImageUrl: string | null; lessonCount: number; completedCount: number | null; progress: number | null };
export type LessonSummary = { id: number; title: string; description: string | null; position: number; durationMinutes: number | null; completed: boolean };
export type CourseDetail = { course: CourseCard; lessons: LessonSummary[]; continueLessonId: number | null };
export type NoteDto = { id: number; kind: string; title: string; body: string; attachmentName?: string; attachmentUrl?: string };
export type ResourceDto = { id: number; title: string; type: string; contentOrUrl: string };
export type LessonDetail = {
  id: number; title: string; description: string | null; embedUrl: string | null; durationMinutes: number | null; completed: boolean;
  course: { id: number; title: string; slug: string }; lessons: LessonSummary[]; prevId: number | null; nextId: number | null;
  notes: NoteDto[]; benefits: NoteDto[]; resources: ResourceDto[]; quizId: number | null; quizTitle: string | null; completedCount: number; totalCount: number;
};
export type Reply = { id: number; body: string; authorName: string; teacher: boolean; mine: boolean; createdAt: string };
export type QuestionDto = { id: number; body: string; status: 'SUBMITTED' | 'ANSWERED' | 'RESOLVED' | 'HIDDEN'; lessonId: number; lessonTitle: string; courseTitle: string; learnerName?: string; learnerEmail?: string; gender?: Gender; askedBy: string; mine: boolean; createdAt: string; replies: Reply[] };
export type Dashboard = {
  name: string; stats: { enrolledCourses: number; completedLessons: number; quizzesTaken: number; questions: number };
  overallPercent: number; overallDone: number; overallTotal: number;
  continueLearning: { lessonId: number; lessonTitle: string; course: CourseCard } | null;
  courses: CourseCard[]; activity: { type: string; text: string; at: string }[];
  latestNotes: { id: number; title: string; kind: string; body: string; updatedAt: string }[];
  recentQuestions: { id: number; body: string; status: string; lessonTitle: string; createdAt: string }[];
};
export type NoteItem = { id: number; kind: string; title: string; body: string; attachmentName?: string; attachmentUrl?: string; lessonId: number | null; lessonTitle: string | null; courseTitle: string | null; updatedAt: string };
export type QuizView = {
  id: number; title: string; instructions: string | null; passPercentage: number; totalPoints: number; version: number;
  questions: { id: number; type: 'MCQ' | 'SHORT_ANSWER' | 'ESSAY'; prompt: string; points: number; options: { id: number; text: string }[] }[];
  attempts: { id: number; status: string; percentage: number | null; passed: boolean | null; submittedAt: string; scoreAwarded: number | null; scorePossible: number | null }[];
};
export type QuizResult = {
  attemptId: number; quizId: number; quizTitle: string; lessonId: number; status: 'AWAITING_REVIEW' | 'GRADED'; finalScore: boolean;
  scoreAwarded: number; scorePossible: number; percentage: number; passed: boolean | null; passPercentage: number; submittedAt: string;
  questions: { answerId: number | null; questionId: number; type: string; prompt: string; points: number; awarded: number | null; pendingReview: boolean; feedback: string | null;
    selectedOptionId: number | null; textAnswer: string | null; modelAnswer: string | null; options: { id: number; text: string; correct: boolean }[] }[];
};
export type Room = { id: number; title: string; description: string | null; postCount: number };
export type Post = { id: number; parentId: number | null; body: string; authorName: string; teacher: boolean; mine: boolean; createdAt: string };
