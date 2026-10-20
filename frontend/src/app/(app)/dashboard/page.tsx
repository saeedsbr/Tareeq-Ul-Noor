'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, ClipboardList, HelpCircle, MessageSquare, StickyNote } from 'lucide-react';
import { get } from '@/lib/api';
import type { Dashboard } from '@/lib/types';
import CourseCard, { CourseCover } from '@/components/CourseCard';
import { Empty, ErrorBox, ProgressBar, Spinner } from '@/components/ui';
import { statusLabel, timeAgo } from '@/lib/format';
import { Badge } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

export default function DashboardPage() {
  const { t } = useI18n();
  const q = useQuery({ queryKey: ['dashboard'], queryFn: () => get<Dashboard>('/me/progress') });
  if (q.isLoading) return <Spinner />;
  if (q.isError || !q.data) return <ErrorBox message={t("We couldn’t load your dashboard.")} retry={() => q.refetch()} />;
  const d = q.data; const c = d.continueLearning;
  const stats = [
    { n: d.stats.enrolledCourses, l: t('dash.enrolled'), i: BookOpen }, { n: d.stats.completedLessons, l: t('dash.completed'), i: CheckCircle2 },
    { n: d.stats.quizzesTaken, l: t('dash.quizzes'), i: ClipboardList }, { n: d.stats.questions, l: t('dash.questionsAsked'), i: HelpCircle },
  ];
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <div>
          <h1 className="h1 text-2xl md:text-3xl">{t('dash.greeting')}, {d.name.split(' ')[0]}</h1>
          <p className="text-sm text-muted">{t('dash.blessing')}</p>
        </div>

        <section className="pattern rounded-card bg-gradient-to-br from-deep to-forest-800 p-6 text-white">
          <p dir="rtl" lang="ar" className="font-arabic text-xl leading-loose text-sand">مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ</p>
          <p className="mt-2 text-sm text-white/85">“Whoever takes a path in search of knowledge, Allah will make easy for him the path to Paradise.”</p>
          <p className="text-xs text-white/55">{t("— Ṣaḥīḥ Muslim")}</p>
        </section>

        <section className="card p-5" aria-label={t("Overall progress")}>
          <div className="flex items-center justify-between text-sm"><span className="font-semibold">{t('dash.progress')}</span><span className="text-muted">{t("{done} / {total} lessons · {pct}%", { done: d.overallDone, total: d.overallTotal, pct: d.overallPercent })}</span></div>
          <div className="mt-3"><ProgressBar value={d.overallPercent} label={t("Overall progress")} /></div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label={t("Summary")}>
          {stats.map((s) => (
            <div key={s.l} className="card p-4 text-center"><s.i className="mx-auto h-4 w-4 text-forest" aria-hidden /><p className="mt-1 font-serif text-2xl font-semibold">{s.n}</p><p className="text-xs text-muted">{s.l}</p></div>
          ))}
        </section>

        <section aria-labelledby="cont">
          <h2 id="cont" className="h2 mb-3">{t('dash.continue')}</h2>
          {c ? (
            <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="w-full overflow-hidden rounded-lg sm:w-28"><CourseCover course={c.course} className="h-24" /></div>
              <div className="flex-1">
                <p className="font-semibold">{c.course.title}</p>
                <p className="text-xs text-muted">{t("Next: {title}", { title: c.lessonTitle })}</p>
                <div className="mt-2 flex items-center gap-3"><div className="flex-1"><ProgressBar value={c.course.progress ?? 0} /></div><span className="text-xs text-muted">{c.course.progress}%</span></div>
              </div>
              <Link href={`/lessons/${c.lessonId}`} className="btn-primary">{t('dash.continueBtn')}</Link>
            </div>
          ) : <Empty title={t("Nothing in progress yet")} hint={t("Pick a course to begin your journey.")} action={<Link href="/courses" className="btn-primary">{t("Explore courses")}</Link>} />}
        </section>

        <section aria-labelledby="mycourses">
          <div className="mb-3 flex items-center justify-between"><h2 id="mycourses" className="h2">{t('dash.myCourses')}</h2><Link href="/my-courses" className="text-sm text-forest hover:underline">{t('home.viewAll')}</Link></div>
          {d.courses.length === 0 ? <p className="text-sm text-muted">{t("Courses you start will appear here.")}</p>
            : <div className="grid gap-4 sm:grid-cols-2">{d.courses.slice(0, 4).map((x) => <CourseCard key={x.id} course={x} />)}</div>}
        </section>

        <section aria-labelledby="rq">
          <div className="mb-3 flex items-center justify-between"><h2 id="rq" className="h2">{t('dash.recentQ')}</h2><Link href="/questions" className="text-sm text-forest hover:underline">{t('home.viewAll')}</Link></div>
          {d.recentQuestions.length === 0 ? <p className="text-sm text-muted">{t("You haven’t asked any questions yet.")}</p> : (
            <ul className="card divide-y divide-line">{d.recentQuestions.map((x) => (
              <li key={x.id}><Link href="/questions" className="flex items-center gap-3 p-4"><MessageSquare className="h-4 w-4 text-sand" aria-hidden />
                <div className="flex-1"><p className="line-clamp-1 text-sm">{x.body}</p><p className="text-xs text-muted">{x.lessonTitle} · {timeAgo(x.createdAt)}</p></div><Badge kind={x.status}>{t(statusLabel[x.status])}</Badge></Link></li>))}</ul>
          )}
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card p-4" aria-labelledby="act"><h2 id="act" className="mb-3 text-sm font-semibold">{t('dash.activity')}</h2>
          {d.activity.length === 0 ? <p className="text-xs text-muted">{t("Your activity will show up here.")}</p> : (
            <ul className="space-y-3">{d.activity.map((a, i) => (
              <li key={i} className="flex gap-3 text-xs"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden /><div><p>{a.text}</p><p className="text-muted">{timeAgo(a.at)}</p></div></li>))}</ul>)}
        </section>
        <section className="card p-4" aria-labelledby="ln"><div className="mb-3 flex justify-between"><h2 id="ln" className="text-sm font-semibold">{t('dash.notes')}</h2><Link href="/notes" className="text-xs text-forest hover:underline">{t('home.viewAll')}</Link></div>
          {d.latestNotes.length === 0 ? <p className="text-xs text-muted">{t("No notes yet.")}</p> : (
            <ul className="space-y-3">{d.latestNotes.map((n) => (
              <li key={n.id} className="flex gap-3 text-xs"><StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-sand" aria-hidden /><div><p className="font-medium">{n.title}</p><p className="line-clamp-2 text-muted">{n.body}</p></div></li>))}</ul>)}
        </section>
      </aside>
    </div>
  );
}
