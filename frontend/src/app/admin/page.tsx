'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Circle, GraduationCap, Inbox, PenLine, Plus, Users } from 'lucide-react';
import { get } from '@/lib/api';
import { useMe } from '@/lib/auth';
import type { QuestionDto } from '@/lib/types';
import { Badge, Spinner } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';

type Overview = { learners: number; publishedCourses: number; lessonCompletions: number; pendingQuestions: number; attemptsAwaitingReview: number; quizAttempts: number };
type Course = { id: number; title: string; status: string; lessonCount: number };
type U = { id: string; name: string; email: string; role: string; createdAt: string; completedLessons: number };
type Lesson = { id: number; status: string; videoUrl: string | null };
type Pending = { attemptId: number; learnerName: string; quizTitle: string; submittedAt: string };

export default function AdminHome() {
  const { t } = useI18n();
  const me = useMe().data;
  const o = useQuery({ queryKey: ['admin-overview'], queryFn: () => get<Overview>('/admin/reports/overview') });
  const qs = useQuery({ queryKey: ['admin-questions', 'SUBMITTED'], queryFn: () => get<QuestionDto[]>('/admin/questions?status=SUBMITTED') });
  const users = useQuery({ queryKey: ['admin-users'], queryFn: () => get<U[]>('/admin/users') });
  const courses = useQuery({ queryKey: ['admin-courses'], queryFn: () => get<Course[]>('/admin/courses') });
  const lessons = useQuery({ queryKey: ['admin-lessons', ''], queryFn: () => get<Lesson[]>('/admin/lessons') });
  const pending = useQuery({ queryKey: ['admin-pending'], queryFn: () => get<Pending[]>('/admin/attempts/pending') });
  if (o.isLoading) return <Spinner />;
  const d = o.data;
  const live = (courses.data ?? []).filter((c) => c.status !== 'ARCHIVED');
  const learners = (users.data ?? []).filter((u) => u.role === 'LEARNER');
  const noVideo = (lessons.data ?? []).filter((l) => l.status === 'PUBLISHED' && !l.videoUrl).length;
  const maxLessons = Math.max(1, ...live.map((c) => c.lessonCount));

  const tiles = [
    { l: 'Learners', n: d?.learners ?? 0, i: Users, h: '/admin/users', tone: 'bg-emerald-50 text-emerald-800' },
    { l: 'Published courses', n: d?.publishedCourses ?? 0, i: BookOpen, h: '/admin/courses', tone: 'bg-amber-50 text-amber-800' },
    { l: 'Lessons completed', n: d?.lessonCompletions ?? 0, i: CheckCircle2, h: '/admin/lessons', tone: 'bg-sky-50 text-sky-800' },
    { l: 'Quiz attempts', n: d?.quizAttempts ?? 0, i: ClipboardCheck, h: '/admin/quizzes', tone: 'bg-violet-50 text-violet-800' },
  ];
  const actions = [
    { l: 'New course', h: '/admin/courses', i: BookOpen }, { l: 'Add a lesson', h: '/admin/lessons', i: GraduationCap },
    { l: 'Build a quiz', h: '/admin/quizzes', i: ClipboardCheck }, { l: 'Write a note', h: '/admin/notes', i: PenLine },
  ];
  const checklist = [
    ['Create a course', live.length > 0, '/admin/courses'],
    ['Add lessons to it', (lessons.data ?? []).length > 0, '/admin/lessons'],
    ['Add YouTube videos to your lessons', (lessons.data ?? []).length > 0 && noVideo === 0, '/admin/lessons'],
    ['Publish a course for learners', (d?.publishedCourses ?? 0) > 0, '/admin/courses'],
    ['Create a quiz', (d?.quizAttempts ?? 0) > 0 || (pending.data?.length ?? 0) > 0, '/admin/quizzes'],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="pattern relative overflow-hidden rounded-card bg-gradient-to-br from-deep via-forest-800 to-forest p-6 text-white md:p-8">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border border-sand/25" aria-hidden />
        <div className="absolute -right-2 -top-6 h-40 w-40 rounded-full border border-sand/20" aria-hidden />
        <p dir="rtl" lang="ar" className="font-arabic text-lg text-sand">السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold md:text-3xl">{t("Welcome, {name}", { name: me?.name?.split(' ')[0] ?? t("Admin") })}</h1>
        <p className="mt-1 max-w-xl text-sm text-white/80">
          {(d?.pendingQuestions ?? 0) + (d?.attemptsAwaitingReview ?? 0) > 0
            ? t("Questions waiting for a reply: {q}. Quizzes to grade: {a}.", { q: d!.pendingQuestions, a: d!.attemptsAwaitingReview })
            : t("You’re all caught up. New questions and written quiz answers will appear here.")}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {actions.map((a) => <Link key={a.l} href={a.h} className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20"><Plus className="h-4 w-4" />{t(a.l)}</Link>)}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label={t("Key numbers")}>
        {tiles.map((tile) => (
          <Link key={tile.l} href={tile.h} className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tile.tone}`}><tile.i className="h-5 w-5" /></span>
            <div><p className="font-serif text-3xl font-semibold leading-none">{tile.n}</p><p className="mt-1 text-xs text-muted">{t(tile.l)}</p></div>
          </Link>))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card" aria-labelledby="att">
            <div className="flex items-center justify-between border-b border-line p-4"><h2 id="att" className="flex items-center gap-2 font-semibold"><Inbox className="h-4 w-4 text-forest" /> {t("Needs your attention")}</h2>
              <Link href="/admin/questions" className="text-xs font-medium text-forest hover:underline">{t("Open inbox")}</Link></div>
            {(qs.data?.length ?? 0) === 0 && (pending.data?.length ?? 0) === 0 ? (
              <div className="p-8 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-forest/60" aria-hidden /><p className="mt-2 text-sm font-medium">{t("Nothing waiting")}</p><p className="text-xs text-muted">{t("Unanswered questions and quizzes to grade will show up here.")}</p></div>
            ) : (
              <ul className="divide-y divide-line">
                {(qs.data ?? []).slice(0, 4).map((q) => (
                  <li key={`q${q.id}`}><Link href="/admin/questions" className="flex items-start gap-3 p-4 hover:bg-sand-100/40">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-800"><Inbox className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-medium">{q.body}</p><p className="text-xs text-muted">{q.learnerName} · {q.lessonTitle} · {timeAgo(q.createdAt)}</p></div><Badge kind="SUBMITTED">{t("Pending")}</Badge></Link></li>))}
                {(pending.data ?? []).slice(0, 4).map((p) => (
                  <li key={`a${p.attemptId}`}><Link href="/admin/quizzes" className="flex items-start gap-3 p-4 hover:bg-sand-100/40">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-800"><PenLine className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-medium">{t("Written answers from {name}", { name: p.learnerName })}</p><p className="text-xs text-muted">{p.quizTitle} · {timeAgo(p.submittedAt)}</p></div><span className="text-xs font-medium text-forest">{t("Grade →")}</span></Link></li>))}
              </ul>)}
          </section>

          <section className="card" aria-labelledby="crs">
            <div className="flex items-center justify-between border-b border-line p-4"><h2 id="crs" className="flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4 text-forest" /> {t("Courses")}</h2>
              <Link href="/admin/courses" className="text-xs font-medium text-forest hover:underline">{t("Manage")}</Link></div>
            {live.length === 0 ? <p className="p-6 text-center text-sm text-muted">{t("No courses yet. Create your first one to get started.")}</p> : (
              <ul className="divide-y divide-line">{live.map((c) => (
                <li key={c.id} className="flex items-center gap-4 p-4"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{c.title}</p>
                  <div className="mt-1.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-forest/10"><div className="h-full rounded-full bg-forest" style={{ width: `${(c.lessonCount / maxLessons) * 100}%` }} /></div></div>
                  <span className="text-xs text-muted">{t("Lessons: {n}", { n: c.lessonCount })}</span><Badge>{c.status}</Badge></li>))}</ul>)}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-4" aria-labelledby="gs">
            <h2 id="gs" className="font-semibold">{t("Getting started")}</h2>
            <p className="mt-0.5 text-xs text-muted">{t("{done} of {total} done", { done: checklist.filter((c) => c[1]).length, total: checklist.length })}</p>
            <ul className="mt-3 space-y-2.5">{checklist.map(([label, done, h]) => (
              <li key={label}><Link href={h} className="flex items-center gap-2.5 text-sm hover:text-forest">
                {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-forest" aria-label={t("Done")} /> : <Circle className="h-4 w-4 shrink-0 text-line" aria-label={t("To do")} />}
                <span className={done ? 'text-muted line-through' : ''}>{t(label)}</span></Link></li>))}</ul>
            {noVideo > 0 && <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">{t("Published lessons without a video: {n}", { n: noVideo })}</p>}
          </section>

          <section className="card" aria-labelledby="ln">
            <div className="flex items-center justify-between border-b border-line p-4"><h2 id="ln" className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-forest" /> {t("New learners")}</h2>
              <Link href="/admin/users" className="text-xs font-medium text-forest hover:underline">{t("All")}</Link></div>
            {learners.length === 0 ? <p className="p-5 text-center text-sm text-muted">{t("No learners have signed up yet.")}</p> : (
              <ul className="divide-y divide-line">{learners.slice(0, 5).map((u) => (
                <li key={u.id} className="flex items-center gap-3 p-3.5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white">{u.name.charAt(0).toUpperCase()}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{u.name}</p><p className="text-xs text-muted">{t("Joined {when}", { when: timeAgo(u.createdAt) })}</p></div>
                  <span className="text-xs text-muted">{t("Lessons done: {n}", { n: u.completedLessons })}</span></li>))}</ul>)}
          </section>
        </aside>
      </div>
      <p className="flex items-center gap-1 text-xs text-muted"><ArrowRight className="h-3 w-3" /> {t("Learners’ questions and replies are private between the learner and you.")}</p>
    </div>
  );
}
