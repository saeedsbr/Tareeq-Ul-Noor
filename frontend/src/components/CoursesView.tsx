'use client';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import CourseCard from '@/components/CourseCard';
import { Empty } from '@/components/ui';
import type { CourseCard as C } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

export default function CoursesView({ q, courses }: { q: string; courses: C[] }) {
  const { t } = useI18n();
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="h1">{t("Courses")}</h1>
        <p className="mt-1 text-muted">{q ? t("Results for “{q}”", { q }) : t("Browse all published courses. Sign in to track your progress.")}</p>
        <form className="mt-6 flex max-w-md gap-2" role="search">
          <label htmlFor="q" className="sr-only">{t("Search courses")}</label>
          <input id="q" name="q" defaultValue={q} placeholder={t("Search by title or topic")} className="input" />
          <button className="btn-primary">{t("Search")}</button>
        </form>
        <div className="mt-8">
          {courses.length === 0
            ? <Empty title={q ? t("No courses match your search") : t("No courses yet")} hint={t("Try a different keyword or check back soon.")} />
            : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{courses.map((c) => <CourseCard key={c.id} course={c} />)}</div>}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
