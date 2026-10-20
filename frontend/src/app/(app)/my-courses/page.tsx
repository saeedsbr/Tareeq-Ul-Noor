'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { CourseCard as C } from '@/lib/types';
import CourseCard from '@/components/CourseCard';
import { Empty, ErrorBox, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

export default function MyCourses() {
  const { t } = useI18n();
  const q = useQuery({ queryKey: ['my-courses'], queryFn: () => get<C[]>('/me/courses') });
  return (
    <div>
      <h1 className="h1 text-2xl md:text-3xl">{t("My Courses")}</h1>
      <div className="mt-6">
        {q.isLoading ? <Spinner /> : q.isError ? <ErrorBox retry={() => q.refetch()} /> : q.data!.length === 0
          ? <Empty title={t("You haven’t started a course yet")} hint={t("Complete your first lesson and the course will appear here.")} action={<Link href="/courses" className="btn-primary">{t("Browse courses")}</Link>} />
          : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{q.data!.map((c) => <CourseCard key={c.id} course={c} />)}</div>}
      </div>
    </div>
  );
}
