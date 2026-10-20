import Link from 'next/link';
import type { CourseCard as C } from '@/lib/types';
import { ProgressBar } from './ui';
import { useI18n } from '@/lib/i18n';

const gradients = [
  'from-forest-900 via-forest to-forest-600', 'from-[#3a2f1e] via-[#6b5430] to-[#a58a56]',
  'from-forest-800 via-forest to-forest-600', 'from-[#4a3b26] via-[#7d6338] to-[#bfa36a]',
];

export function CourseCover({ course, className = 'h-32' }: { course: Pick<C, 'id' | 'coverImageUrl' | 'title'>; className?: string }) {
  if (course.coverImageUrl)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={course.coverImageUrl} alt="" className={`${className} w-full object-cover`} />;
  return (
    <div className={`${className} pattern w-full bg-gradient-to-br ${gradients[course.id % gradients.length]} flex items-end p-3`} aria-hidden>
      <span className="font-arabic text-2xl text-sand/80">علم</span>
    </div>
  );
}

export default function CourseCard({ course, href }: { course: C; href?: string }) {
  const { t } = useI18n();
  const showProgress = course.progress !== null && course.progress !== undefined;
  return (
    <Link href={href ?? `/courses/${course.slug}`} className="card group block overflow-hidden transition-shadow hover:shadow-md">
      <div className="overflow-hidden"><CourseCover course={course} /></div>
      <div className="p-4">
        <h3 className="font-serif text-base font-semibold group-hover:text-forest">{course.title}</h3>
        <p className="mt-1 text-xs text-muted">
          {course.lessonCount === 0 ? t("Lessons coming soon") : t("Lessons: {n}", { n: course.lessonCount })}
          {showProgress && ` · ${t("{pct}% completed", { pct: course.progress ?? 0 })}`}
        </p>
        {showProgress && <div className="mt-2.5"><ProgressBar value={course.progress!} label={`${course.title} progress`} /></div>}
      </div>
    </Link>
  );
}
