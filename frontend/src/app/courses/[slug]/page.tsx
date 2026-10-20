'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { CourseCover } from '@/components/CourseCard';
import { ErrorBox, ProgressBar, Spinner } from '@/components/ui';
import { get } from '@/lib/api';
import { useMe } from '@/lib/auth';
import type { CourseDetail } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

export default function CoursePage() {
  const { t } = useI18n();
  const { slug } = useParams<{ slug: string }>();
  const { data: me } = useMe();
  const q = useQuery({ queryKey: ['course', slug, me?.id], queryFn: () => get<CourseDetail>(`/courses/${slug}`) });
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        {q.isLoading && <Spinner />}
        {q.isError && <ErrorBox message={t("We couldn’t find this course.")} />}
        {q.data && (() => {
          const { course, lessons, continueLessonId } = q.data;
          const target = continueLessonId ? (me ? `/lessons/${continueLessonId}` : `/login?next=/lessons/${continueLessonId}`) : null;
          return (
            <>
              <div className="card overflow-hidden"><CourseCover course={course} className="h-44" />
                <div className="p-6">
                  <p className="text-xs uppercase tracking-wide text-muted">{course.level}</p>
                  <h1 className="h1 mt-1">{course.title}</h1>
                  <p className="mt-3 text-muted">{course.description}</p>
                  {me && course.lessonCount > 0 && <div className="mt-4 max-w-sm"><ProgressBar value={course.progress ?? 0} /><p className="mt-1 text-xs text-muted">{t("{done}/{total} lessons · {pct}%", { done: course.completedCount ?? 0, total: course.lessonCount, pct: course.progress ?? 0 })}</p></div>}
                  {target && <Link href={target} className="btn-primary mt-5">{me && (course.completedCount ?? 0) > 0 ? t("Continue learning") : t("Start learning")}</Link>}
                  {!me && <p className="mt-3 text-xs text-muted">{t("Create a free account to save your progress, ask questions and take quizzes.")}</p>}
                </div>
              </div>
              <h2 className="h2 mt-8">{t("Lessons")}</h2>
              {lessons.length === 0 ? <p className="mt-3 text-sm text-muted">{t("This course isn’t ready yet. Lessons will appear here once published.")}</p> : (
                <ol className="card mt-3 divide-y divide-line">
                  {lessons.map((l, i) => (
                    <li key={l.id}>
                      <Link href={me ? `/lessons/${l.id}` : `/login?next=/lessons/${l.id}`} className="flex items-center gap-3 p-4 hover:bg-sand-100/50">
                        {l.completed ? <CheckCircle2 className="h-5 w-5 text-forest" aria-label={t("Completed")} /> : <Circle className="h-5 w-5 text-line" aria-hidden />}
                        <div className="flex-1"><p className="text-sm font-medium">{i + 1}. {l.title}</p>{l.description && <p className="line-clamp-1 text-xs text-muted">{l.description}</p>}</div>
                        {l.durationMinutes && <span className="text-xs text-muted">{t("{n} min", { n: l.durationMinutes })}</span>}
                        <PlayCircle className="h-4 w-4 text-muted" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </>
          );
        })()}
      </main>
      <PublicFooter />
    </>
  );
}
